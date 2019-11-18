package br.com.softbox.tpm.brief;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import br.com.softbox.tpm.TpmUtil;

public final class CacheManager {
	private static final Logger logger = Logger.getLogger(CacheManager.class.getName());
	public static final Path CACHE_REPOSITORY_PATH = Paths.get(System.getProperty("user.home"), ".thrust-cache");
	public static final String CACHE_REPOSITORY = CACHE_REPOSITORY_PATH.toString();

	private final Path repositoryPath;
	private final boolean canRemove;
	private final boolean isRepository;

	public CacheManager(Path cachePath, boolean canRemove) {
		super();
		this.repositoryPath = cachePath != null ? cachePath : CACHE_REPOSITORY_PATH;
		this.isRepository = CACHE_REPOSITORY_PATH.toAbsolutePath().equals(this.repositoryPath.toAbsolutePath());
		this.canRemove = !isRepository && canRemove;
	}

	public String type() {
		return isRepository ? "repository" : canRemove ? "temporary" : "local";
	}

	/**
	 * Se não é o local cache, remove o diretório.
	 * 
	 * @return <code>True</code> se chamou ação de remover o diretório.
	 * @throws IOException Falha ao remover o diretório.
	 */
	public boolean clear() throws IOException {
		if (canRemove) {
			TpmUtil.rmdir(repositoryPath);
		}
		return canRemove;
	}

	public Path getCacheBitcodeRepositoryPath() {
		return repositoryPath.resolve(Bitcode.LIB_BITCODES_DIR);
	}

	public Path getCacheJarRepositoryPath() {
		return repositoryPath.resolve("jars");
	}

	public Path installBitcodeInCache(Bitcode bitcode) {
		Path cacheBitcodeVersionPath = getCacheBitcodeVersionPath(bitcode);
		if (!Files.exists(cacheBitcodeVersionPath) || !bitcode.isNumberVersion()) {
			try {
				installBitcode(bitcode, cacheBitcodeVersionPath);
			} catch (Exception e) {
				throw new RuntimeException("Failed to download", e);
			}
		}
		return cacheBitcodeVersionPath;
	}

	private Path getCacheBitcodeVersionPath(Bitcode bitcode) {
		Path bitcodeRootPath = bitcode.getRootPath();
		Path cacheBitcodeRootPath = getCacheBitcodeRepositoryPath().resolve(bitcodeRootPath);
		return cacheBitcodeRootPath.resolve(bitcode.getVersionOrDefault());
	}

	public Path installLocalJarInCache(Jar jar, BriefFile briefFile) {
		File rootDirectory = briefFile.getRootDirectory();
		File jarCacheFile = DependencyHelper.getLocalJarPath(jar, rootDirectory.getAbsolutePath()).toFile();
		if (!jarCacheFile.exists()) {
			throw new RuntimeException("For " + briefFile.getName() + ", local jar not found: " + jar.getName());
		}
		Path bitcodePath = repositoryPath.resolve(Bitcode.LIB_BITCODES_DIR).toAbsolutePath();
		if (jarCacheFile.getAbsolutePath().startsWith(bitcodePath.toString())) {
			System.out.printf(" %s: Local jar locate in cache directory.%n", TpmUtil.prefix(jar));
		}
		return jarCacheFile.toPath();
	}

	public Path installJarInCache(Jar jar) {
		Path jarRootCachePath = getCacheJarRepositoryPath().resolve(jar.getGroup());
		Path jarCachePath = jarRootCachePath.resolve(jar.getName());

		String prefix = TpmUtil.prefix(jar);
		if (!Files.exists(jarCachePath)) {
			System.out.printf(" %s: downloading.%n", prefix);
			TpmUtil.mkdirs(jarRootCachePath);
			try {
				Downloader.downloadJar(jar, jarCachePath);
			} catch (IOException ioe) {
				throw new RuntimeException("Failed to download " + jar.getName(), ioe);
			}
			System.out.printf(" %s: downloaded to jar cache.%n", prefix);
		} else {
			System.out.printf(" %s: located in cache directory.%n", prefix);
		}

		return jarCachePath;
	}

	public Path installPOMInCache(Jar jar) {
		Path jarRootCachePath = getCacheJarRepositoryPath().resolve(jar.getGroup());
		Path pomCachePath = jarRootCachePath.resolve(jar.getPomName());
		String prefix = TpmUtil.prefix(jar);
		if (Files.exists(pomCachePath)) {
			System.out.printf(" %s: POM file found in cache.%n", prefix);
		} else {
			System.out.printf(" %s: downloading POM file.%n", prefix);
			try {
				Downloader.downloadJarPOM(jar, pomCachePath);
			} catch (IOException e) {
				throw new RuntimeException("Failed to download POM for " + jar.getName(), e);
			}
			System.out.printf(" %s: downloaded POM file.%n", prefix);
		}
		return pomCachePath;
	}

	private void installBitcode(Bitcode bitcode, Path cacheBitcodeVersionPath) throws IOException {
		final String msgPrefix = TpmUtil.prefix(bitcode);
		File tempDnlDir = Files.createTempDirectory(bitcode.getRepository() + "-install").toFile();
		try {
			File dnlZipFile = downloadBitCodeToTemporaryDirectory(bitcode, msgPrefix, tempDnlDir);
			BriefFile unzipedBriefFile = unzipTemporaryDirectoryAndVerifyBitcode(tempDnlDir, dnlZipFile);

			System.out.printf(" %s: downloaded.%n", msgPrefix);

			copyBitcodeFromTemporaryDirectory(cacheBitcodeVersionPath, unzipedBriefFile);
			System.out.printf(" %s: copied to %s cache.%n", msgPrefix, type());
		} finally {
			try {
				TpmUtil.rmdir(tempDnlDir);
			} catch (IOException ioe) {
				logger.log(Level.SEVERE, "Failed to remove " + tempDnlDir, ioe);
			}
		}
	}

	private static void copyBitcodeFromTemporaryDirectory(Path cacheBitcodeVersionPath, BriefFile unzipedBriefFile)
			throws IOException {
		TpmUtil.cleanOrMakeDir(cacheBitcodeVersionPath);
		Optional<String> briefPathToCopy = unzipedBriefFile.getPath();
		File zipRootDirectory = unzipedBriefFile.getRootDirectory();
		if (!briefPathToCopy.isPresent() || briefPathToCopy.get().equals(".")) {
			TpmUtil.copyDirectory(zipRootDirectory, cacheBitcodeVersionPath.toFile(), null);
		} else {
			File pathToCopy = new File(zipRootDirectory.getAbsolutePath(), briefPathToCopy.get());
			if (pathToCopy.isDirectory()) {
				TpmUtil.copyDirectory(pathToCopy, cacheBitcodeVersionPath.toFile(), null);
			} else {
				TpmUtil.copy(pathToCopy, cacheBitcodeVersionPath.resolve(briefPathToCopy.get()));
			}
			TpmUtil.copy(unzipedBriefFile.getFile(), cacheBitcodeVersionPath.resolve(BriefFile.FILE_NAME));
		}
		Consumer<? super Jar> copyLocalJar = (jar) -> copyLocalJarsFromBitcodeFromTemporaryDirectory(jar,
				cacheBitcodeVersionPath, unzipedBriefFile);
		unzipedBriefFile.getLocalJars().forEach(copyLocalJar);
	}

	private static void copyLocalJarsFromBitcodeFromTemporaryDirectory(Jar jar, Path cacheBitcodeVersionPath,
			BriefFile unzipedBriefFile) {
		File zipRootDirectory = unzipedBriefFile.getRootDirectory();
		String jarName = jar.getName();
		Path jarPath = cacheBitcodeVersionPath.resolve(jar.getName());
		if (!Files.exists(jarPath)) {
			Path originalJarPath = Paths.get(zipRootDirectory.getAbsolutePath(), jarName);
			TpmUtil.mkdirsParent(jarPath);
			try {
				TpmUtil.copy(originalJarPath, jarPath);
			} catch (IOException ioe) {
				throw new RuntimeException("Failed to copy original jar: " + jarName, ioe);
			}
		}
	}

	private static BriefFile unzipTemporaryDirectoryAndVerifyBitcode(File tempDnlDir, File dnlZipFile)
			throws IOException {
		List<String> unzipedFiles = unzipBitcode(dnlZipFile, tempDnlDir.getAbsolutePath());
		BriefFile unzipedBriefFile = verifyBitcodeHasBriefFile(tempDnlDir, unzipedFiles);
		return unzipedBriefFile;
	}

	private static File downloadBitCodeToTemporaryDirectory(Bitcode bitcode, final String msgPrefix, File tempDnlDir)
			throws IOException {
		File dnlZipFile = File.createTempFile(bitcode.getName(), ".zip", tempDnlDir);

		System.out.printf(" %s: downloading to cache directory.%n", msgPrefix);

		Downloader.downloadBitcode(bitcode, dnlZipFile);
		if (!dnlZipFile.exists()) {
			throw new RuntimeException(" Download bitcode " + bitcode.getName() + " failed (IE)");
		}
		return dnlZipFile;
	}

	private static BriefFile verifyBitcodeHasBriefFile(File tempUnzipedDir, List<String> unzipedFiles)
			throws IOException {
		File unzipedBriefFile = Paths.get(tempUnzipedDir.getAbsolutePath(), unzipedFiles.get(0), BriefFile.FILE_NAME)
				.toFile();
		if (!unzipedBriefFile.exists()) {
			throw new RuntimeException("Invalid Thrust bitcode, file not found: " + BriefFile.FILE_NAME);
		}
		return BriefFile.loadFromFile(unzipedBriefFile);
	}

	private static List<String> unzipBitcode(File bitcodeZip, String destDirectory) throws IOException {
		List<String> unzipedFiles = new ArrayList<>();
		try (ZipInputStream zipIn = new ZipInputStream(new FileInputStream(bitcodeZip))) {
			unzipEntry(zipIn, destDirectory, unzipedFiles);
		}
		return unzipedFiles;
	}

	private static void unzipEntry(ZipInputStream zipIn, String destDirectory, List<String> unzipedFiles)
			throws IOException {
		ZipEntry zipEntry = zipIn.getNextEntry();
		while (zipEntry != null) {
			String zipEntryName = zipEntry.getName();
			unzipedFiles.add(zipEntryName);
			Path newFilePath = Paths.get(destDirectory, zipEntryName);
			if (zipEntry.isDirectory()) {
				TpmUtil.mkdirs(newFilePath);
			} else {
				Files.copy(zipIn, newFilePath, StandardCopyOption.REPLACE_EXISTING);
			}
			zipIn.closeEntry();
			zipEntry = zipIn.getNextEntry();
		}
	}

}