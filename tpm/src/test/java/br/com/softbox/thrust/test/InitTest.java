package br.com.softbox.thrust.test;

import java.io.File;
import java.nio.file.Files;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.brief.BriefFile;

public class InitTest extends AbstractTpmTest {

	static final String PARAM_PATH = "-p";

	static void assertInitDirectory(File baseDirFile) throws Exception {
		Assert.assertTrue(baseDirFile.exists());
		Assert.assertTrue(baseDirFile.isDirectory());

		File file = new File(baseDirFile, BriefFile.FILE_NAME);
		loadBriefFile(file);

		file = new File(baseDirFile, "src");
		assertDirectoryExists(file);

		file = new File(file, "index.js");
		loadTextFile(file);
	}

	@Test
	public void initThrustApplication() throws Exception {
		File baseDirFile = getFileDir("init01");
		rmdir(baseDirFile);

		tpmInit(PARAM_PATH, baseDirFile.getAbsolutePath());
		assertInitDirectory(baseDirFile);
	}

	@Test
	public void initThrustNotEmptyDirectory() throws Exception {
		File baseDirFile = getFileDir("init02");
		TpmUtil.cleanOrMakeDir(baseDirFile);

		File trashFile = new File(baseDirFile, "trash.txt");
		Files.write(trashFile.toPath(), "I'm a trash\n".getBytes("utf8"));
		assertFileExists(trashFile);

		try {
			tpmInit(PARAM_PATH, baseDirFile.getAbsolutePath());
			throw new Exception("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("must be empty"));
		}
	}

	@Test
	public void initThrustForceNotEmptyDirectory() throws Exception {
		File baseDirFile = getFileDir("init03");
		TpmUtil.cleanOrMakeDir(baseDirFile);

		File trashFile = new File(baseDirFile, "oztrash.txt");
		Files.write(trashFile.toPath(), "I'm here\n".getBytes("utf8"));
		assertFileExists(trashFile);

		tpmInit(PARAM_PATH, baseDirFile.getAbsolutePath(), "-f");
		assertInitDirectory(baseDirFile);
	}

	@Test
	public void initThrustForceEmptyDirectory() throws Exception {
		File baseDirFile = getFileDir("init04");
		TpmUtil.cleanOrMakeDir(baseDirFile);
		tpmInit("-f", PARAM_PATH, baseDirFile.getAbsolutePath());
		assertInitDirectory(baseDirFile);
	}

	@Test
	public void initFileAsRootDirectory() throws Exception {
		File baseFile = getFileDir("init05");
		saveTextFile(baseFile, "Empty");
		Assert.assertTrue(baseFile.exists());
		try {
			tpmInit(PARAM_PATH, baseFile.getAbsolutePath());
			throw new Exception("Not here");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("to be a directory"));
		}
	}

	@Test
	public void testInitNotEmptyDefaultDirectory() throws Exception {
		try {
			tpmInit();
			throw new Exception("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("empty"));
		}
	}

}
