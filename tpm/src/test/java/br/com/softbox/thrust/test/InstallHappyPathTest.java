package br.com.softbox.thrust.test;

import java.io.File;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.Assert;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;

import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.action.InstallAction;
import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.BriefFile;
import br.com.softbox.tpm.brief.Dependency;
import br.com.softbox.tpm.brief.DependencyHelper;
import br.com.softbox.tpm.brief.Jar;

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class InstallHappyPathTest extends AbstractTpmTest {

	private static final File BASE_DIR = getFileDir("install-project-01");
	private static final File LOCAL_CACHE_DIR = getFileDir("cache-install-01");
	private static final File LOCAL_LIB_DIR = new File(BASE_DIR, Dependency.LIB_ROOT_DIR);
	private static final File BKP01_BRIEF_FILE = new File(BASE_DIR, "brief-01");
	private static final File BRIEF_FILE_FILE = new File(BASE_DIR, BriefFile.FILE_NAME);

	private static String getProjectDir() {
		return BASE_DIR.getAbsolutePath();
	}

	private static List<String> getDefaultArgs() {
		return toList(InstallAction.COMMAND_NAME, "-p", BASE_DIR.getAbsolutePath());
	}

	private static void tpmInstall01(List<String> installArgs) {
		List<String> args = getDefaultArgs();
		args.addAll(installArgs);
		tpmMain(args);
	}

	private static void tpmInstall01(String... args) {
		tpmInstall01(toList(args));
	}

	private static void tpmInstallNoCache(List<String> installArgs) {
		installArgs.add("-nc");
		tpmInstall01(installArgs);
	}

	private static void tpmInstallNoCache(String... args) {
		tpmInstallNoCache(toList(args));
	}

	private static void tpmInstallLocalCache(List<String> installArgs) {
		installArgs.add("-cp");
		installArgs.add(LOCAL_CACHE_DIR.getAbsolutePath());
		tpmInstall01(installArgs);
	}

	private static void tpmInstallLocalCache(String... args) {
		tpmInstallLocalCache(toList(args));
	}

	static void updateBriefFileFromBkp01() throws Exception {
		assertDirectoryExists(BASE_DIR);
		assertFileExists(BKP01_BRIEF_FILE);

		Files.copy(BKP01_BRIEF_FILE.toPath(), BRIEF_FILE_FILE.toPath(), StandardCopyOption.REPLACE_EXISTING);

		BriefFile briefFile = loadBriefFile(BRIEF_FILE_FILE);
		Assert.assertTrue(briefFile.getDependencies().isEmpty());
	}

	static void verifyDependencyInBriefFile(String reference) throws Exception {
		verifyDependencyInBriefFile(DependencyHelper.buildFromResource(reference));
	}

	static void verifyDependencyInBriefFile(Dependency dependency) throws Exception {
		verifyDependencyInBriefFile(dependency, loadBriefFile(BRIEF_FILE_FILE));
	}

	static void verifyDependencyInBriefFile(Dependency dependency, BriefFile briefFile) throws Exception {
		Assert.assertTrue(briefFile.hasDependencies());
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertNotNull(dependencies);
		Assert.assertFalse(dependencies.isEmpty());

		Assert.assertTrue(dependencies.contains(dependency));
	}

	static BriefFile verifyDependencyInstall(String reference) throws Exception {
		return verifyDependencyInstall(BASE_DIR, reference);
	}

	static BriefFile verifyDependencyInstall(File baseDir, String reference) throws Exception {
		File briefFileFile = new File(baseDir, BriefFile.FILE_NAME);
		BriefFile briefFile = loadBriefFile(briefFileFile);
		Dependency dependency = DependencyHelper.buildFromResource(reference);

		verifyDependencyInBriefFile(dependency, briefFile);

		if (dependency instanceof Bitcode) {
			Bitcode bitcode = (Bitcode) dependency;
			File bitcodeDir = Paths
					.get(LOCAL_LIB_DIR.getAbsolutePath(), Bitcode.LIB_BITCODES_DIR, bitcode.getRootPath().toString())
					.toFile();
			assertDirectoryNotEmpty(bitcodeDir);
		} else {
			Jar jar = (Jar) dependency;
			Assert.assertNotNull(jar);
			File jarFile = LOCAL_LIB_DIR.toPath().resolve(Jar.LIB_JARS_DIR).resolve(jar.getName()).toFile();
			assertFileExists(jarFile);
		}

		return briefFile;
	}

	static void removeLocalLib() throws Exception {
		TpmUtil.rmdir(LOCAL_LIB_DIR);
		Assert.assertFalse(LOCAL_LIB_DIR.exists());
	}

	private static void verifyHasOneDependency(final String reference) throws Exception {
		BriefFile briefFile = verifyDependencyInstall(reference);
		Assert.assertNotNull(briefFile);
		Assert.assertFalse(briefFile.getDependencies().isEmpty());
		Assert.assertEquals(briefFile.getDependencies().size(), 1);
	}

	private static void verifyHasMoreJars(int n) throws IOException {
		Path dirJars = LOCAL_LIB_DIR.toPath().resolve(Jar.LIB_JARS_DIR);
		try (DirectoryStream<Path> dirStream = Files.newDirectoryStream(dirJars)) {
			AtomicInteger count = new AtomicInteger(0);
			dirStream.forEach(p -> count.incrementAndGet());
			Assert.assertTrue(count.get() > n);
		}
	}

	static void install101AndVerifyHas1Dependency(String reference) throws Exception {
		tpmInstall01(reference);
		verifyHasOneDependency(reference);
	}

	static void createLocalJar(Path file) throws IOException {
		if (!Files.exists(file)) {
			Files.write(file, new byte[] { 0, 1 });
		}
		Assert.assertTrue(Files.exists(file));
	}

	private static Path createLocalJar(String localJarName) throws IOException {
		Path localJarPath = Paths.get(getProjectDir(), localJarName);
		createLocalJar(localJarPath);
		return localJarPath;
	}

	// =====================================================================
	// Tests
	// =====================================================================

	@Test
	public void t01_initEmptyDirectory() throws Exception {
		TpmUtil.rmdir(BASE_DIR);
		Assert.assertFalse(BASE_DIR.exists());
		InitTest.tpmInit("-p", getProjectDir());
		InitTest.assertInitDirectory(BASE_DIR);
	}

	@Test
	public void t02_01_installNothingDefaultCache() throws Exception {
		rmdirThrustUserCache();
		tpmInstall01();
	}

	@Test
	public void t02_02_installNothingNoCache() throws Exception {
		rmdirThrustUserCache();
		tpmInstallNoCache();
	}

	@Test
	public void t02_03_installNothingLocalCache() throws Exception {
		rmdirThrustUserCache();
		tpmInstallLocalCache();
	}

	@Test
	public void t03_01_validateBriefFileNoDependencies() throws Exception {
		BriefFile briefFile = loadBriefFileFromProject(BASE_DIR);
		List<?> list = briefFile.getDependencies();
		Assert.assertTrue(list.isEmpty());
		Files.copy(BRIEF_FILE_FILE.toPath(), BKP01_BRIEF_FILE.toPath(), StandardCopyOption.REPLACE_EXISTING);
	}

	@Test
	public void t04_01_installBitcodeEtlNoCache() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstallNoCache(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t04_02_installBitcodeEtlLocalCache() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstallLocalCache(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t04_03_installBitcodeEtlGlobalCache() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstallLocalCache(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t05_01_installBitcodeEtlNoCacheReferenceOnBriefFile() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		verifyDependencyInBriefFile(reference);
		tpmInstallNoCache();
		verifyDependencyInstall(reference);
	}

	@Test
	public void t05_02_installBitcodeEtlLocalCacheReferenceOnBriefFile() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		verifyDependencyInBriefFile(reference);
		tpmInstallLocalCache();
		verifyDependencyInstall(reference);
	}

	@Test
	public void t05_03_installBitcodeEtlGlobalCacheReferenceOnBriefFile() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		verifyDependencyInBriefFile(reference);
		tpmInstall01();
		verifyHasOneDependency(reference);
	}

	@Test
	public void t06_01_installJarPostgresNoCache() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstallNoCache(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t06_02_installJarPostgresLocalCache() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstallLocalCache(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t06_03_installJarPostgresGlobalCache() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstall01(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t07_01_installJarPostgresNoCacheReferenceOnBriefFile() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		verifyDependencyInBriefFile(reference);
		tpmInstallNoCache();
		verifyHasOneDependency(reference);
	}

	@Test
	public void t07_02_installJarPostgresLocalCacheReferenceOnBriefFile() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		verifyDependencyInBriefFile(reference);
		tpmInstallLocalCache();
		verifyHasOneDependency(reference);
	}

	@Test
	public void t07_03_installJarPostgresGlobalCacheReferenceOnBriefFile() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		verifyDependencyInBriefFile(reference);
		tpmInstall01();
		verifyHasOneDependency(reference);
	}

	@Test
	public void t08_01_installSameBitcodeVersion() throws Exception {
		final String reference = "etl";
		removeLocalLib();
		updateBriefFileFromBkp01();
		for (int i = 0; i < 2; i++) {
			install101AndVerifyHas1Dependency(reference);
		}
	}

	@Test
	public void t08_02_installSameJarVersion() throws Exception {
		final String reference = "postgresql:postgresql:8.1-407.jdbc3";
		removeLocalLib();
		updateBriefFileFromBkp01();
		for (int i = 0; i < 2; i++) {
			install101AndVerifyHas1Dependency(reference);
		}
	}

	@Test
	public void t09_01_installJarWithPOMDependencies() throws Exception {
		final String reference = "org.apache.poi:poi:4.1.0";
		removeLocalLib();
		updateBriefFileFromBkp01();
		tpmInstall01(reference);
		tpmInstall01();
		verifyHasMoreJars(1);
	}

	@Test
	public void t10_01_installBitcodeDifferentReleases() throws Exception {
		final List<String> references = Arrays.asList("mail", "mail@1.2.0", "mail@1.2.1");
		removeLocalLib();
		updateBriefFileFromBkp01();
		for (String reference : references) {
			install101AndVerifyHas1Dependency(reference);
		}
		verifyHasMoreJars(1);
	}

	@Test
	public void t10_02_installBitcodeDifferentReleases() throws Exception {
		final List<String> references = Arrays.asList("mail@1.2.0", "mail@1.2.1", "mail");
		removeLocalLib();
		updateBriefFileFromBkp01();
		for (String reference : references) {
			install101AndVerifyHas1Dependency(reference);
		}
		verifyHasMoreJars(1);
	}

	@Test
	public void t10_02_installJarDifferentReleases() throws Exception {
		final List<String> references = Arrays.asList("postgresql:postgresql:8.1-407.jdbc3",
				"postgresql:postgresql:9.1-901.jdbc4");
		removeLocalLib();
		updateBriefFileFromBkp01();

		for (String reference : references) {
			install101AndVerifyHas1Dependency(reference);
		}
		verifyHasMoreJars(0);
	}

	@Test
	public void t11_01_installBitcodeFromGitlabV1() throws Exception {
		String reference = "gitlab://ozairjr/sample-bitcode-01@0.0.1";
		tpmInstall01(reference);
		verifyDependencyInstall(reference);
	}

	@Test
	public void t11_02_installBitcodeFromGitlabV2() throws Exception {
		String reference = "gitlab://ozairjr/sample-bitcode-01@0.0.2";
		tpmInstallLocalCache(reference);
		verifyDependencyInstall(reference);
		Path jarPath = Paths.get(LOCAL_LIB_DIR.getAbsolutePath(), Jar.LIB_JARS_DIR, "sample-bitcode-01-0.0.2.jar");
		assertFileExists(jarPath.toFile());
	}

	@Test
	public void t12_01_installLocalJar() throws Exception {
		String localJarName = "./meu-jar.jar";
		createLocalJar(localJarName);

		String dependency = ":" + localJarName + ":";
		tpmInstall01(dependency);

		Path jarPath = Paths.get(LOCAL_LIB_DIR.getAbsolutePath(), Jar.LIB_JARS_DIR, localJarName);
		assertFileExists(jarPath.toFile());
	}

	@Test
	public void t12_02_updateLocalJar() throws Exception {
		String localJarName = "./meu-jar.jar";
		createLocalJar(localJarName);

		tpmInstall01();

		Path jarPath = Paths.get(LOCAL_LIB_DIR.getAbsolutePath(), Jar.LIB_JARS_DIR, localJarName);
		assertFileExists(jarPath.toFile());
	}

	@Test
	public void t12_03_installLocalJarCompletePath() throws IOException {
		String localJarName = "meu-jar-2.jar";
		Path path = createLocalJar(localJarName);

		String dependency = ":" + path.toAbsolutePath().toString() + ":";
		tpmInstall01(dependency);

		Path jarPath = Paths.get(LOCAL_LIB_DIR.getAbsolutePath(), Jar.LIB_JARS_DIR, localJarName);
		assertFileExists(jarPath.toFile());
	}

}
