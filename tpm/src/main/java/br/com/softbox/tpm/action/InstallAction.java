package br.com.softbox.tpm.action;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

import br.com.softbox.tpm.Tpm;
import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.BitcodeCache;
import br.com.softbox.tpm.brief.BriefFile;
import br.com.softbox.tpm.brief.CacheManager;
import br.com.softbox.tpm.brief.Dependency;
import br.com.softbox.tpm.brief.DependencyCache;
import br.com.softbox.tpm.brief.DependencyHelper;
import br.com.softbox.tpm.brief.Downloader;
import br.com.softbox.tpm.brief.Jar;
import br.com.softbox.tpm.brief.JarCache;
import br.com.softbox.tpm.brief.PomHelper;

/**
 * Instala as dependencias do projeto.
 * 
 * @author softbox
 */
public final class InstallAction extends AbstractCommandAction {
	public static final String COMMAND_NAME = "install";
	private static final String PARAM_NO_CACHE = "INSTALL_NO_CACHE";
	private static final String PARAM_CACHE_DIR = "INSTALL_CACHE_DIR";

	private static final Logger logger = Logger.getLogger(InstallAction.class.getName());
	private static final List<String> HELP = Arrays.asList(
			"tpm install               Install/update dependencies in current thrust directory.",
			"tpm install <dependency> Install/update dependency in current thrust directory.",
			"A dependency can be a bitcode or a .jar package.", "", "Commom options:",
			"  -nc           No cache; don't save/update dependencies on \"${HOME}/.thrust-cache\".",
			"  -cp <folder>  Save/update dependencies on the specific cache folder.",
			"  -p <folder> Save/update dependencies in the informed folder.");

	private File installDirFile;

	public InstallAction() {
		super(COMMAND_NAME,
				CommandLineParser.builder().defaultParameter().pathParameter().helpParameter()
						.add(PARAM_NO_CACHE, true, "-nc", "--no-cache").add(PARAM_CACHE_DIR, "-cp", "--cache-path")
						.done());
	}

	@Override
	public void processAction() {
		preInstallAction();
		System.out.println("tpm " + Tpm.VERSION + " install from: " + installDirFile.getName());
		BriefFile mainBriefJson = readBriefJson(getInstallDir());
		installNewDependencies(mainBriefJson);
		install(mainBriefJson);
	}

	@Override
	protected void processHelp() {
		HELP.forEach(System.out::println);
	}

	private void preInstallAction() {
		this.installDirFile = null;
		getInstallDir();
	}

	private List<DependencyCache> installDependenciesInCache(BriefFile briefFile, CacheManager cacheManager) {
		List<DependencyCache> dependencies = new ArrayList<>();
		installAllDependenciesInCache(briefFile, cacheManager, dependencies);
		return dependencies;
	}

	private void installAllDependenciesInCache(BriefFile briefFile, CacheManager cacheManager,
			List<DependencyCache> dependencies) {
		List<Bitcode> pkgBitcodes = briefFile.getBitcodes();
		List<Jar> pkgJars = briefFile.getJars();

		pkgBitcodes.forEach(bitcode -> installBitcodeInCache(bitcode, cacheManager, dependencies));
		pkgJars.forEach(jar -> installJarInCache(jar, cacheManager, dependencies, briefFile));
	}

	private void installBitcodeInCache(Bitcode bitcode, CacheManager cacheManager, List<DependencyCache> dependencies) {
		if (DependencyCache.containsSameVersion(dependencies, bitcode)) {
			return;
		}
		BitcodeCache bitcodeCache;
		Path cacheBitcodePath = cacheManager.installBitcodeInCache(bitcode);
		try {
			bitcodeCache = BitcodeCache.loadFromPath(bitcode, cacheBitcodePath);
		} catch (Exception e) {
			throw new RuntimeException("Failed to load brief file from " + bitcode.getName(), e);
		}
		dependencies.add(bitcodeCache);
		installAllDependenciesInCache(bitcodeCache.getBriefFile(), cacheManager, dependencies);
	}

	private void installJarInCache(Jar jar, CacheManager cacheManager, List<DependencyCache> dependencies,
			BriefFile briefFile) {
		if (DependencyCache.containsSameVersion(dependencies, jar)) {
			return;
		}
		Path cacheJarPath;
		if (jar.isLocal()) {
			cacheJarPath = cacheManager.installLocalJarInCache(jar, briefFile);
		} else {
			cacheJarPath = cacheManager.installJarInCache(jar);
		}
		JarCache jarCache = new JarCache(jar, cacheJarPath);
		dependencies.add(jarCache);
		if (!jar.isLocal()) {
			installAllPOMDependencies(jarCache, cacheManager, dependencies);
		}
	}

	private void installAllPOMDependencies(JarCache jarCache, CacheManager cacheManager,
			List<DependencyCache> dependecies) {
		Jar mainJar = jarCache.getDependencyAs();
		Path pomCachePath = cacheManager.installPOMInCache(mainJar);
		List<Jar> jarsDependencies;
		try {
			jarsDependencies = PomHelper.listRuntimeDependencies(pomCachePath);
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			throw new RuntimeException("Failed to load POM dependencies for " + mainJar.getName(), e);
		}
		jarsDependencies.forEach(jar -> installJarInCache(jar, cacheManager, dependecies, null));
	}

	private Path getCachePath() {
		Path cachePath = null;
		if (isArgumentPresent(PARAM_NO_CACHE)) {
			try {
				cachePath = Files.createTempDirectory("tmp-install");
			} catch (IOException ioe) {
				throw new RuntimeException("Failed to create temporary cache", ioe);
			}
		} else if (isArgumentPresent(PARAM_CACHE_DIR)) {
			Optional<String> optCacheDir = getArgument(PARAM_CACHE_DIR);
			cachePath = Paths.get(optCacheDir.get()).toAbsolutePath();
		}
		return cachePath;
	}

	private String getInstallDir() {
		if (installDirFile == null) {
			Optional<String> optInstallDir = getPathArgument();
			File installDirFile = new File(optInstallDir.isPresent() ? optInstallDir.get() : "").getAbsoluteFile();
			this.installDirFile = installDirFile;
			if (!this.installDirFile.exists()) {
				throw new RuntimeException("Directory not found: " + installDirFile.getAbsolutePath());
			}
			if (!this.installDirFile.isDirectory()) {
				throw new RuntimeException("Expected a directory: " + installDirFile.getAbsolutePath());
			}
		}
		return this.installDirFile.getAbsolutePath();
	}

	private List<DependencyCache> install(BriefFile mainBriefFile) {
		if (mainBriefFile.getDependencies().isEmpty()) {
			return new ArrayList<>(0);
		}
		final CacheManager cacheManager = new CacheManager(getCachePath(), isArgumentPresent(PARAM_NO_CACHE));
		try {
			System.out.printf("* Updating %s cache...%n", cacheManager.type());
			List<DependencyCache> dependencies = installDependenciesInCache(mainBriefFile, cacheManager);
			clearLocalLib();
			System.out.printf("* Updating .lib with dependencies...%n", cacheManager.type());
			dependencies.forEach(this::installInLocalLib);
			return dependencies;
		} finally {
			try {
				cacheManager.clear();
			} catch (IOException e) {
				logger.log(Level.SEVERE, "Failed to clear temporary cache", e);
			}
		}
	}

	private void clearLocalLib() {
		Path localLibDir = Paths.get(getInstallDir(), Dependency.LIB_ROOT_DIR);
		System.out.println("* Cleanning .lib");
		try {
			TpmUtil.cleanOrMakeDir(localLibDir);
		} catch (IOException ioe) {
			throw new RuntimeException("Failed to clean .lib", ioe);
		}
	}

	private void installInLocalLib(DependencyCache dependencyCache) {
		String installDir = getInstallDir();
		Path bitcodeRootLibDir = Paths.get(installDir, Dependency.LIB_ROOT_DIR, Bitcode.LIB_BITCODES_DIR);
		Path jarRootLibDir = Paths.get(installDir, Dependency.LIB_ROOT_DIR, Jar.LIB_JARS_DIR);

		if (dependencyCache instanceof BitcodeCache) {
			installBitcodeInLocalLib(dependencyCache, bitcodeRootLibDir);
		} else {
			TpmUtil.mkdirs(jarRootLibDir);
			installJarInLocalLib(dependencyCache, jarRootLibDir);
		}
	}

	private static void installJarInLocalLib(DependencyCache dependencyCache, Path rootLibPath) {
		Jar jar = dependencyCache.getDependencyAs();
		String prefix = TpmUtil.prefix(jar);
		Path jarPath = rootLibPath.resolve(jar.getName());
		try {
			TpmUtil.copy(dependencyCache.getCachePath(), jarPath);
		} catch (Exception e) {
			throw new RuntimeException("Failed to install jar " + jar.getName() + " on local lib", e);
		}
		System.out.printf("  %s: installed on local jar lib%n", prefix);
	}

	private static void installBitcodeInLocalLib(DependencyCache dependencyCache, Path rootLibDir) {
		Bitcode bitcode = dependencyCache.getDependencyAs();
		String prefix = TpmUtil.prefix(bitcode);
		Path bitcodePath = rootLibDir.resolve(bitcode.getRootPath());

		try {
			TpmUtil.cleanOrMakeDir(bitcodePath);
			TpmUtil.copyDirectory(dependencyCache.getCachePath().toFile(), bitcodePath.toFile(), Jar::notHasJarSufix);
		} catch (IOException ioe) {
			throw new RuntimeException("Failed to copy bitcode " + bitcode.getName() + " to local lib", ioe);
		}
		System.out.printf("  %s: installed on local lib%n", prefix);
	}

	private void installNewDependencies(BriefFile mainBriefJson) {
		Optional<String> optResourceName = getDefaultArgument();
		if (!optResourceName.isPresent()) {
			return;
		}
		String resourceName = optResourceName.get();
		System.out.printf("* Install resource: %s.%n", resourceName);
		Dependency dependency = DependencyHelper.buildFromResource(optResourceName.get());

		checkNewDependency(dependency);

		if (DependencyHelper.addDependency(mainBriefJson, dependency)) {
			System.out.printf(" %s: added to brief.json%n", resourceName);
			updateBriefJson(mainBriefJson);
		} else {
			System.out.printf(" %s: is already in brief.json%n", resourceName);
		}
	}
	
	private void checkNewDependency(Dependency dependency) {
		if (Jar.isLocalJar(dependency)) {
			Path localJarPath = DependencyHelper.getLocalJarPath((Jar) dependency, this.installDirFile.getAbsolutePath());
			if (!Files.exists(localJarPath)) {
				throw new RuntimeException("Local jar not found: " + dependency.getReference());
			}
		} else {
			Downloader.checkForDownload(dependency);
		}
	}

	private static void updateBriefJson(BriefFile briefJson) {
		try {
			briefJson.serialize();
		} catch (IOException e) {
			throw new RuntimeException("Failed to update dependencies on file " + briefJson.getFile().getName(), e);
		}
	}

	private static BriefFile readBriefJson(String installDir) {
		File briefJsonFile = new File(installDir, BriefFile.FILE_NAME);
		if (!briefJsonFile.exists()) {
			throw new RuntimeException(
					"This isn't a thrust app, 'brief.json' not found on '" + briefJsonFile.getAbsolutePath() + "'.");
		}
		try {
			return BriefFile.loadFromFile(briefJsonFile);
		} catch (IOException e) {
			throw new RuntimeException("Failed to load " + briefJsonFile.getAbsolutePath(), e);
		}
	}
}