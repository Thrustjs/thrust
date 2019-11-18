package br.com.softbox.thrust.core;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

import br.com.softbox.thrust.core.Thrust;

import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

public class ThrustTest {

	private static final String CHARSET_UTF8 = "utf8";
	private static ByteArrayOutputStream outContent;
	private static final PrintStream originalOut = System.out;

	private static String getOutContentAsStr() throws UnsupportedEncodingException {
		return outContent.toString(CHARSET_UTF8);
	}

	@BeforeClass
	public static void beforeClass() throws Exception {
		outContent = new ByteArrayOutputStream();
		System.setOut(new PrintStream(outContent, true, CHARSET_UTF8));
	}

	@Before
	public void before() {
		outContent.reset();
	}

	@AfterClass
	public static void afterClass() {
		System.setOut(originalOut);
		assertTrue(true);
	}

	@Test
	public void testRequireConst() throws Exception {
		Thrust.main(new String[] { new File(".").getCanonicalPath() + "/src/test/js/require/requireconst/startup.js" });
		assertEquals("value\n", getOutContentAsStr());
	}

	@Test
	public void testRequireFunction() throws Exception {
		Thrust.main(
				new String[] { new File(".").getCanonicalPath() + "/src/test/js/require/requirefunction/startup.js" });
		assertEquals("value\n", getOutContentAsStr());
	}

	@Test
	public void testRequireJSON() throws Exception {
		Thrust.main(new String[] { new File(".").getCanonicalPath() + "/src/test/js/require/json/startup.js" });
		assertEquals("true\n", getOutContentAsStr());
	}

	@Test
	public void testRequireIndexOnFolder() throws Exception {
		Thrust.main(
				new String[] { new File(".").getCanonicalPath() + "/src/test/js/require/indexonfolder/startup.js" });
		assertEquals("true\n", getOutContentAsStr());
	}

	@Test
	public void testRequireWithJsExtension() throws Exception {
		Thrust.main(new String[] {
				new File(".").getCanonicalPath() + "/src/test/js/require/requirewithjsextension/startup.js" });
		assertEquals("OK!\n", getOutContentAsStr());
	}

	@Test
	public void testRequireThrustBitcode() throws Exception {
		Thrust.main(new String[] {
				new File(".").getCanonicalPath() + "/src/test/js/require/requirethrustbitcode/startup.js" });
		assertEquals("OK!\n", getOutContentAsStr());
	}

	@Test
	public void testRequireInChain() throws Exception {
		Thrust.main(
				new String[] { new File(".").getCanonicalPath() + "/src/test/js/require/requireinchain/startup.js" });
		assertEquals("OK!\n", getOutContentAsStr());
	}

	@Test
	public void testContextIsolation() throws Exception {
		Thrust.main(
				new String[] { new File(".").getCanonicalPath() + "/src/test/js/require/contextisolation/startup.js" });
		assertEquals("startup.js\n", getOutContentAsStr());
	}

	@Test
	public void testScopeIsolation() throws IOException {
		try {
			Thrust.main(new String[] {
					new File(".").getCanonicalPath() + "/src/test/js/require/scopeisolation/startup.js" });
			assertTrue(false);
		} catch (Exception e) {
			assertEquals("ReferenceError: myVar is not defined", e.getMessage());
		}
	}

	@Test
	public void accessCurrentDir() throws Exception {
		Thrust.main(
				new String[] { new File(".").getCanonicalPath() + "/src/test/js/general/accesscurrentdir/startup.js" });
		assertEquals(new File(".").getCanonicalPath() + "/src/test/js/general/accesscurrentdir/folder\n",
				getOutContentAsStr());
	}

	@Test
	public void accessRootDir() throws Exception {
		Thrust.main(
				new String[] { new File(".").getCanonicalPath() + "/src/test/js/general/accessrootdir/startup.js" });
		assertEquals(new File(".").getCanonicalPath() + "/src/test/js/general/accessrootdir\n", getOutContentAsStr());
	}

	@Test
	public void testValidConfig() throws Exception {
		Thrust.main(new String[] {
				new File(".").getCanonicalPath() + "/src/test/js/general/config/validconfig/startup.js" });
		assertEquals("true\n", getOutContentAsStr());
	}

	@Test
	public void testEmptyConfig() throws Exception {
		Thrust.main(new String[] {
				new File(".").getCanonicalPath() + "/src/test/js/general/config/emptyconfig/startup.js" });
		assertEquals("{}\n", getOutContentAsStr());
	}

	@Test
	public void testChangeValidConfig() throws Exception {
		Thrust.main(new String[] {
				new File(".").getCanonicalPath() + "/src/test/js/general/config/changevalidconfig/startup.js" });
		assertEquals("thrust\n", getOutContentAsStr());
	}

	@Test
	public void testNoArgs() throws Exception {
		try {
			Thrust.main(new String[0]);
			Assert.fail();
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Inform a thrust file or directory"));
		}
	}

	@Test
	public void testInvalidFile() throws Exception {
		final String fileName = "where-is-thrust-file";
		try {
			Thrust.main(new String[] { fileName });
			Assert.fail();
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Invalid thrust file/directory"));
			Assert.assertTrue(e.getMessage().contains(fileName));
		}
	}

	@Test
	public void testInvalidDirectory() throws Exception {
		final String fileName = "src/test/js/worker01";
		try {
			Thrust.main(new String[] { fileName });
			Assert.fail();
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().startsWith("Not found 'index.js' on"));
			Assert.assertTrue(e.getMessage().contains(fileName));
		}
	}

	@Test
	public void testIndexFromDirectory() throws Exception {
		Thrust.main(new String[] { Paths.get("./src/test/js/sample01").toString() });
		assertEquals("Sample 01\n", getOutContentAsStr());
	}

	@Test
	public void testIndexFromDirectoryFile() throws Exception {
		Thrust.main(new String[] { Paths.get("./src/test/js/sample01/sample01.js").toString() });
		assertEquals("Sample 01\n", getOutContentAsStr());
	}

	@Test
	public void testIndexForEmptyJarDirectory() throws Exception {
		Thrust.main(new String[] { Paths.get("./src/test/js/sample02").toAbsolutePath().toString() });
		assertEquals("Sample empty-jar\n", getOutContentAsStr());
	}

	@Test
	public void testForJarDirectoryAsFile() throws Exception {
		try {
			Thrust.main(new String[] { Paths.get("./src/test/js/sample03-not-jar-dir").toAbsolutePath().toString() });
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().startsWith("Expected to be a JAR directory"));
		}
	}

	@Test
	public void testParameterArgButNoFile() throws Exception {
		try {
			Thrust.main(new String[] { "-vf" });
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().startsWith("No thrust file or directory was informed"));
		}
	}

	@Test
	public void testLoadJar() throws Exception {
		Thrust.main(new String[] { Paths.get("./src/test/js/sample04/src").toAbsolutePath().toString() });
		assertEquals("x=(134)\n", getOutContentAsStr());
	}

	@Test
	public void testGetThrustArgsMinusV() throws Exception {
		List<String> args;
		Optional<String> optArg;
		final String argArg1 = "-v1";
		Path appPath = Paths.get("./src/test/js/sample02");

		optArg = Thrust.findArg(null);
		Assert.assertFalse(optArg.isPresent());

		Thrust.main(new String[] { appPath.toAbsolutePath().toString(), argArg1 });
		args = Thrust.getThrustArgs();
		Assert.assertFalse(args.isEmpty());
		Assert.assertEquals(args.size(), 1);
		optArg = Thrust.findArg(argArg1);
		Assert.assertTrue(optArg.isPresent());

		Thrust.main(new String[] { appPath.toAbsolutePath().toString() });
		args = Thrust.getThrustArgs();
		Assert.assertTrue(args.isEmpty());
		Assert.assertEquals(args.size(), 0);
		optArg = Thrust.findArg(argArg1);
		Assert.assertFalse(optArg.isPresent());

		Assert.assertEquals(Thrust.getAppDirectory().toString(), appPath.toAbsolutePath().toString());
	}

	@Test
	public void testThrustVersion() throws Exception {
		Path appPath = Paths.get("./src/test/js/general/thrust-version.js");
		Thrust.main(new String[] { appPath.toString() });
		String outStr = getOutContentAsStr();
		Assert.assertEquals(outStr, String.format("%s%n", Thrust.VERSION));
	}

	@Test
	public void testThrustShowVersion() throws Exception {
		final String outV = String.format("thrust %s%n", Thrust.VERSION);
		for (String arg : new String[] { "-v", "--version" }) {
			Thrust.main(new String[] { arg });
			Assert.assertEquals(getOutContentAsStr(), outV);
			outContent.reset();
		}
	}

	@Test
	public void testThreadError() throws Exception {
		PrintStream errStream = System.err;
		try {
			ByteArrayOutputStream bosErr = new ByteArrayOutputStream();
			PrintStream newErrStream = new PrintStream(bosErr, true, CHARSET_UTF8);
			System.setErr(newErrStream);
			Thrust.main(new String[] { "./src/test/js/general/no-thread.js" });

			String success = getOutContentAsStr();
			Assert.assertEquals(success, String.format("Success%n"));
			String err = bosErr.toString(CHARSET_UTF8);
			Assert.assertTrue(err.contains("Multi threaded"));
			Assert.assertTrue(err.contains("but is not allowed"));
		} finally {
			System.setErr(errStream);
		}
	}

	@Test
	public void testPromiseWait() throws Exception {
		Thrust.main(new String[] { "./src/test/js/general/no-wait-01.js" });
		String str = getOutContentAsStr();
		Assert.assertNotNull(str);
		Assert.assertTrue(str.contains("First call"));
		Assert.assertTrue(str.contains("Second call"));
		Assert.assertTrue(str.contains("After all"));
		Assert.assertTrue(str.contains("10"));
		Assert.assertTrue(str.contains("30"));
		Assert.assertTrue(str.contains("11"));
		Assert.assertTrue(str.contains("31"));
	}

	@Test
	public void testNoBitcodeToLoad() throws Exception {
		try {
			Thrust.main(new String[] { "./src/test/js/general/no-bitcode-here.js" });
			Assert.fail("Cannot load what is not here");
		} catch (Exception e) {
			Assert.assertTrue("Could not found: " + e.getMessage(), e.getMessage().contains("Could not found"));
			Assert.assertTrue("ozjr/no-bitcode.js: " + e.getMessage(), e.getMessage().contains("ozjr/no-bitcode.js"));
		}
	}

	@Test
	public void testSimpleWorkerContext() throws Exception {
		Thrust.main(new String[] { "src/test/js/simpletest" });
		String str = getOutContentAsStr();
		Assert.assertNotNull(str);
		Assert.assertTrue(str.contains("main."));
		Assert.assertTrue(str.contains("confirmed failed"));
		Assert.assertTrue(str.contains("Already initiated"));
		Assert.assertTrue(str.contains("waiting scripts"));
		Assert.assertTrue(str.contains("script01: running"));
		Assert.assertTrue(str.contains("script01: ended"));
		Assert.assertTrue(str.contains("simple: continue"));
		Assert.assertTrue(str.contains("A string from other context"));
	}
	
	@Test
	public void testSimpleWorkerContextRelativePath() throws Exception {
		Thrust.main(new String[] { "src/test/js/simpletest/index-relative-path.js" });
		String str = getOutContentAsStr();
		Assert.assertNotNull(str);
		Assert.assertTrue(str.contains("main."));
		Assert.assertTrue(str.contains("confirmed failed"));
		Assert.assertTrue(str.contains("Already initiated"));
		Assert.assertTrue(str.contains("waiting scripts"));
		Assert.assertTrue(str.contains("script01: running"));
		Assert.assertTrue(str.contains("script01: ended"));
		Assert.assertTrue(str.contains("simple: continue"));
		Assert.assertTrue(str.contains("A string from other context"));
	}

	@Test
	public void testSimpleWorkerInvalidRequire() throws Exception {
		Thrust.main(new String[] { "src/test/js/simpletest/invalid-require.js" });
		String str = getOutContentAsStr();
		Assert.assertNotNull(str);
		Assert.assertTrue(str.contains("main."));
		Assert.assertTrue(str.contains("running script"));
		Assert.assertTrue(str.contains("Failed to run no-script"));
		Assert.assertTrue(str.contains("continue"));
		Assert.assertTrue(str.contains("bye bye"));
	}

	@Test
	public void testJavaStringHelper() throws Exception {
		Thrust.main(new String[] { "src/test/js/general/jstring.js" });
		String str = getOutContentAsStr();
		Assert.assertNotNull(str);
		Assert.assertTrue(str.contains("no array"));
		Assert.assertTrue(str.contains("array length = 3"));
	}

}
