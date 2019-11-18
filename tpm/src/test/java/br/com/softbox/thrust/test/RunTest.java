package br.com.softbox.thrust.test;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;

import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.action.RunAction;
import br.com.softbox.tpm.brief.BriefFile;

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class RunTest extends AbstractTpmTest {

	private static final File BASE_DIR = getFileDir("run-teste-01");
	private static final File BRIEFFILE_FILE = new File(BASE_DIR, BriefFile.FILE_NAME);
	private static final File SRC_DIR = new File(BASE_DIR, "src");
	private static final File INDEX_JS = new File(SRC_DIR, "index.js");
	private static final String PARAM_TJ_VALUE = new File("./src/test/resources/jars/thrust.jar").getAbsolutePath();
	
	@BeforeClass
	public static void beforeClass() throws Exception {
		Assert.assertTrue(new File(PARAM_TJ_VALUE).exists());
	}

	private static void tpmRun(String... args) {
		tpm(RunAction.COMMAND_NAME, args);
	}
	
	private static void tpmRunTJ(String... args) {
		List<String> initArgs = new ArrayList<>();
		initArgs.addAll(Arrays.asList(RunAction.COMMAND_NAME, "-tj", PARAM_TJ_VALUE));
		Arrays.stream(args).forEach(initArgs::add);
		tpmMain(initArgs);
	}

	private static String getProjectDir() {
		return BASE_DIR.getAbsolutePath();
	}

	// ================================================

	@Test
	public void t01_initTrhustProject() throws Exception {
		TpmUtil.rmdir(BASE_DIR);
		Assert.assertFalse(BASE_DIR.exists());
		InitTest.tpmInit("-p", getProjectDir());
		Assert.assertTrue(BASE_DIR.exists());
	}

	@Test
	public void t02_runFromIndex() throws Exception {
		String src = INDEX_JS.getAbsolutePath();
		tpmRunTJ(src);
	}
	
	@Test
	public void t03_runFromDirectoryPathNoIndex() throws Exception {
		tpmRunTJ("-p", getProjectDir());
	}
	
	@Test
	public void t04_runFromDirectoryPathWihIndex() throws Exception {
		tpmRunTJ("-p", getProjectDir(), "src/index.js");
	}

	@Test
	public void t99_01InvalidDirectoryByParameter() {
		String src = getDir("not-exists-init-01");
		try {
			tpmRunTJ("-p", src);
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Thrust directory not found"));
		}
	}

	@Test
	public void t99_10NoMainInBriefFile() throws Exception {
		BriefFile briefFile = BriefFile.loadFromFile(BRIEFFILE_FILE);
		briefFile.setMain(null);
		briefFile.serialize();
		briefFile = BriefFile.loadFromFile(BRIEFFILE_FILE);
		Assert.assertTrue(TpmUtil.isEmpty(briefFile.getMain()));

		try {
			tpmRunTJ("-p", getProjectDir());
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("No 'main' on brief.json"));
		}
	}

	@Test
	public void t99_11NoBriefFile() throws Exception {
		Assert.assertTrue(BRIEFFILE_FILE.delete());
		Assert.assertFalse(BRIEFFILE_FILE.exists());
		try {
			tpmRunTJ("-p", getProjectDir());
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Failed to load 'brief.json' from "));
		}
	}

	@Test
	public void t99_20InvalidDirectoryByParameterAndAbsolutePath() {
		String src = getProjectDir();
		try {
			tpmRunTJ("-p", src, "/some/path");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Cannot inform '-path' and a absolute file"));
		}
	}
	
	@Test
	public void t99_30NoThrustJar() {
		String src = getProjectDir();
		try {
			tpmRun("-p", src, "someplace");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("The file thrust.jar was not found at "));
		}
	}

}
