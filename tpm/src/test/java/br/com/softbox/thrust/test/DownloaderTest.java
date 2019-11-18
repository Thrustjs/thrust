package br.com.softbox.thrust.test;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.logging.Logger;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.Dependency;
import br.com.softbox.tpm.brief.DependencyHelper;
import br.com.softbox.tpm.brief.Downloader;

public class DownloaderTest {

	private static final Logger logger = Logger.getLogger(DownloaderTest.class.getName());

	private static void deleteZip(File dnlZipFile) {
		if (!dnlZipFile.delete()) {
			logger.warning(() -> "Failed to delete " + dnlZipFile);
		}
	}

	@Test(expected = RuntimeException.class)
	public void testInvalidThrustBitCode() throws Exception {
		String reference = "foo";
		Dependency dependency = DependencyHelper.buildFromResource(reference);
		try {
			Downloader.checkForDownload(dependency);
		} catch (RuntimeException e) {
			Assert.assertNotNull(e);
			Assert.assertTrue(e.getMessage().startsWith("Failed to access reference"));
			Assert.assertTrue(e.getMessage().contains(reference));
			Assert.assertNotNull(e.getCause());
			Assert.assertTrue(e.getCause() instanceof FileNotFoundException);
			throw e;
		}
	}

	@Test(expected = RuntimeException.class)
	public void testInvalidJar() throws Exception {
		String reference = "org2.postgresql:postgresql:42.2.0";
		Dependency dependency = DependencyHelper.buildFromResource(reference);
		try {
			Downloader.checkForDownload(dependency);
		} catch (RuntimeException e) {
			Assert.assertNotNull(e);
			Assert.assertTrue(e.getMessage().startsWith("Failed to access reference"));
			Assert.assertTrue(e.getMessage().contains(reference));
			Assert.assertNotNull(e.getCause());
			Assert.assertTrue(e.getCause() instanceof FileNotFoundException);
			throw e;
		}
	}

	@Test
	public void testValidBitcodeDatabase() throws Exception {
		String reference = "database";
		Dependency dependency = DependencyHelper.buildFromResource(reference);
		Downloader.checkForDownload(dependency);
	}

	@Test
	public void testValidJarPostgres() throws Exception {
		String reference = "org.postgresql:postgresql:42.2.0";
		Dependency dependency = DependencyHelper.buildFromResource(reference);
		Downloader.checkForDownload(dependency);
	}

	@Test
	public void testInvalidJarName() throws Exception {
		String reference = "maybe:jar";
		try {
			DependencyHelper.buildFromResource(reference);
			throw new Exception("ouch");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Invalid jar reference"));
		}
	}

	@Test(expected = FileNotFoundException.class)
	public void downloadInvalidGitlabRepo() throws Exception {
		String reference = "gitlab@thrust-database";
		File dnlZipFile = File.createTempFile("bitcode-" + reference, ".zip");
		Bitcode bitcode = new Bitcode(reference);
		try {
			Downloader.downloadBitcode(bitcode, dnlZipFile);
		} finally {
			deleteZip(dnlZipFile);
		}
	}

	@Test(expected = FileNotFoundException.class)
	public void downloadInvalidBitbucketRepo() throws Exception {
		String reference = "bitbucket://thrust-database";
		File dnlZipFile = File.createTempFile("bitcode-" + reference, ".zip");
		Bitcode bitcode = new Bitcode(reference);
		try {
			Downloader.downloadBitcode(bitcode, dnlZipFile);
		} finally {
			deleteZip(dnlZipFile);
		}
	}

	@Test(expected = FileNotFoundException.class)
	public void downloadInvalidRepoForBitcode() throws Exception {
		String reference = "magalu-softbox@thrust-database@master";
		File dnlZipFile = File.createTempFile("bitcode-" + reference, ".zip");
		Bitcode bitcode = new Bitcode(reference);
		try {
			Downloader.downloadBitcode(bitcode, dnlZipFile);
		} finally {
			deleteZip(dnlZipFile);
		}
	}

}
