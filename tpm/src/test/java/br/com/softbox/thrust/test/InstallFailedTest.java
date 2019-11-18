package br.com.softbox.thrust.test;

import java.io.File;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.action.InstallAction;
import br.com.softbox.tpm.brief.BriefFile;

public class InstallFailedTest extends AbstractTpmTest {

	static void tpmInstall(String... cmdArgs) {
		tpm(InstallAction.COMMAND_NAME, cmdArgs);
	}

	@Test
	public void installFromInvalidThrustDir() throws Exception {
		try {
			tpmInstall("database");
			throw new Exception("Can not continue");
		} catch (RuntimeException e) {
			String errMsg = e.getMessage();
			Assert.assertTrue(errMsg.contains("thrust app"));
			Assert.assertTrue(errMsg.contains("brief.json"));
			Assert.assertTrue(errMsg.contains("not found"));
		}
	}

	@Test
	public void installFromInvalidBriefFile() throws Exception {
		File baseDir = getFileDir("install-invalid-brief-file-02");
		TpmUtil.mkdirs(baseDir);
		assertDirectoryExists(baseDir);

		File fakeBriefFile = new File(baseDir, BriefFile.FILE_NAME);
		saveTextFile(fakeBriefFile, "{\"fake\n");
		assertFileExists(fakeBriefFile);

		try {
			tpmInstall("database", "-p", baseDir.getAbsolutePath());
			throw new Exception("Oh my God!");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Failed to read JSON file"));
		}

	}
	
	@Test
	public void installFromDirectoryNotExists() throws Exception {
		File baseDir = getFileDir("install-no-dir-02");
		TpmUtil.rmdir(baseDir);
		Assert.assertFalse(baseDir.exists());

		try {
			tpmInstall("database", "-p", baseDir.getAbsolutePath());
			throw new Exception("Oh my God!");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Directory not found"));
		}
	}
	
	@Test
	public void installFromFileAsInstallDir() throws Exception {
		File baseDir = getFileDir("install-file-as-dir-02");
		TpmUtil.rmdir(baseDir);
		Assert.assertFalse(baseDir.exists());
		
		saveTextFile(baseDir, "I'm a file");
		assertFileExists(baseDir);
		try {
			tpmInstall("database", "-p", baseDir.getAbsolutePath());
			throw new Exception("Oh my God!");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Expected a directory"));
		}
	}

}
