package br.com.softbox.thrust.test;

import java.io.FileNotFoundException;
import java.nio.file.Paths;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.brief.PomHelper;

public class PomHelperTest {

	@Test(expected = FileNotFoundException.class)
	public void testNoFile() throws Exception {
		PomHelper.listRuntimeDependencies(Paths.get("no-path", "no-pom.xml"));
	}

	@Test(expected = RuntimeException.class)
	public void testInvalidFile() throws Exception {
		try {
			PomHelper.listRuntimeDependencies(Paths.get("src", "test", "resources", "invalid-pom.xml"));
			throw new Exception("Not here");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Failed to parse"));
			throw e;
		}
	}

}
