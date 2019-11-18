package br.com.softbox.thrust.api.thread;

import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.ByteArrayOutputStream;

import org.graalvm.polyglot.PolyglotException;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import br.com.softbox.thrust.core.Thrust;

public class ThrustWorkerOverflowTest {

	private static ByteArrayOutputStream outConsole;
	private static final PrintStream originalOut = System.out;

	@BeforeClass
	public static void beforeAllTests() throws Exception {
		outConsole = new ByteArrayOutputStream();
		System.setOut(new PrintStream(outConsole, true, "utf-8"));
	}

	@Before
	public void beforeEachTest() throws Exception {
		outConsole.reset();
	}

	@AfterClass
	public static void afterAllClass() {
		System.setOut(originalOut);
	}

	@Test(expected = PolyglotException.class)
	public void testWork04InsuficientThreads() throws Exception {

		Path pathMainJs = Paths.get(".", "src", "test", "js", "worker01", "main-worker-4.js");
		Assert.assertTrue(Files.exists(pathMainJs));

		try {
			Thrust.main(new String[] { pathMainJs.toAbsolutePath().toString() });
		} catch (PolyglotException e) {
			Assert.assertFalse(e.isGuestException());
			throw e;
		}

	}

}
