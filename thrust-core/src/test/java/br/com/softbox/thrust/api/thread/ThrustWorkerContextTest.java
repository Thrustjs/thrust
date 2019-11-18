package br.com.softbox.thrust.api.thread;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;

import br.com.softbox.thrust.core.Thrust;

public class ThrustWorkerContextTest {

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

	public void testWork03SameScriptDifferentContext() throws Exception {

		// Teste confirmando contexto isolado.

		Path pathMainJs = Paths.get(".", "src", "test", "js", "worker01", "main-worker-3.js");
		Assert.assertTrue(Files.exists(pathMainJs));

		Thrust.main(new String[] { pathMainJs.toAbsolutePath().toString() });

		String output = outConsole.toString("utf-8");
		Assert.assertTrue(!output.contains("*-*-*-*-*-*-*-* TASK 1 CALLED -*-*-*-*-*-*-*"));
		Assert.assertTrue(!output.contains("*-*-*-*-*-*-*-* TASK 2 CALLED -*-*-*-*-*-*-*"));
		Assert.assertTrue(!output.contains("*-*-*-*-*-*-*-* TASK 2 FINISHED -*-*-*-*-*-*-*"));

		int n = count(output, "(JS) TASK-03=>count(1)");
		Assert.assertEquals(n, 2);

		n = count(output, "(JS) TASK-03=>count(2)");
		Assert.assertEquals(n, 2);
	}

	static int count(String str, String substr) {
		if (str == null) {
			return 0;
		}
		int index = str.indexOf(substr);
		return index == -1 ? 0 : 1 + count(str.substring(index + substr.length()), substr);
	}

}
