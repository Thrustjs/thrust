package br.com.softbox.thrust.core;

import org.junit.Assert;
import org.junit.Test;

public class ValidateGraalJRETest {
	
	@Test
	public void testGraalJre() {
		String name = System.getProperty("java.runtime.name");
		Assert.assertNotNull(name);
		Assert.assertTrue("Must contain OpenJDK: " + name, name.contains("OpenJDK"));

		name = System.getProperty("java.vm.name");
		Assert.assertTrue("Must contain GraalVM: " + name, name.contains("GraalVM"));
	}

}
