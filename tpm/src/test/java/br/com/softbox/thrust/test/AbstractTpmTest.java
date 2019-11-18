package br.com.softbox.thrust.test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;

import br.com.softbox.tpm.Tpm;
import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.action.HelpAction;
import br.com.softbox.tpm.action.InitAction;
import br.com.softbox.tpm.brief.BriefFile;
import br.com.softbox.tpm.brief.CacheManager;

public class AbstractTpmTest {

	private static File tpmTestDirectoryFile;

	@BeforeClass
	public static void beforeAllTests() throws Exception {
		tpmTestDirectoryFile = Files.createTempDirectory("test-tpm").toFile();
		TpmUtil.cleanOrMakeDir(tpmTestDirectoryFile);
	}

	@AfterClass
	public static void afterAllTests() throws Exception {
		if (tpmTestDirectoryFile != null && tpmTestDirectoryFile.exists()) {
			FileUtils.deleteDirectory(tpmTestDirectoryFile);
		}
	}

	static List<String> toList(String... args) {
		List<String> array = new ArrayList<>();
		array.addAll(Arrays.asList(args));
		return array;
	}

	static String getRootDir() {
		return tpmTestDirectoryFile.getAbsolutePath();
	}

	static File getFileDir(String dir) {
		return new File(tpmTestDirectoryFile, dir).getAbsoluteFile();
	}

	static String getDir(String dir) {
		return getFileDir(dir).getAbsolutePath();
	}

	static void tpmMain(String... args) {
		Tpm.main(args);
	}

	static void tpmMain(List<String> args) {
		Tpm.main(args.toArray(new String[args.size()]));
	}

	static void tpm(String cmd, String... cmdArgs) {
		List<String> args = toList(cmdArgs);
		args.add(0, cmd);
		tpmMain(args);
	}

	static void tpmInit(String... cmdArgs) {
		tpm(InitAction.COMMAND_NAME, cmdArgs);
	}

	static void tpmHelp() {
		tpm(HelpAction.COMMAND_NAME);
	}

	static void rmdir(File dir) throws IOException {
		FileUtils.deleteDirectory(dir);
	}

	static void rmdir(Path path) throws IOException {
		rmdir(path.toFile());
	}

	static void rmdirThrustUserCache() throws IOException {
		rmdir(CacheManager.CACHE_REPOSITORY_PATH);
		Assert.assertFalse(Files.exists(CacheManager.CACHE_REPOSITORY_PATH));
	}

	static BriefFile loadBriefFileFromProject(File directory) throws IOException {
		assertDirectoryExists(directory);
		return loadBriefFile(new File(directory, BriefFile.FILE_NAME));
	}

	static BriefFile loadBriefFile(File file) throws IOException {
		assertFileExists(file);

		BriefFile briefFile = BriefFile.loadFromFile(file);
		Assert.assertNotNull(briefFile);

		return briefFile;
	}

	static String loadTextFile(File file) throws IOException {
		assertFileExists(file);
		String str = null;
		byte[] buffer = Files.readAllBytes(file.toPath());
		if (buffer != null && buffer.length > 0) {
			str = new String(buffer, "utf-8");
		}
		return str;
	}

	static void saveTextFile(File file, String text) throws IOException {
		if (file.exists() && !file.delete()) {
			System.out.println("File exists: " + file.getAbsolutePath());
		}
		Files.write(file.toPath(), text.getBytes("utf-8"));
	}

	static void assertFileExists(File file) {
		Assert.assertNotNull(file);
		Assert.assertTrue("Expected file exists: " + file.getAbsolutePath(), file.exists());
	}

	static void assertDirectoryExists(File file) {
		assertFileExists(file);
		Assert.assertTrue(file.isDirectory());
	}

	static void assertDirectoryNotEmpty(File directory) throws IOException {
		assertDirectoryExists(directory);
		Assert.assertFalse(TpmUtil.isEmpty(directory));
	}

}
