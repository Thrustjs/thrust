package br.com.softbox.thrust.core;

import java.util.List;

import org.junit.Assert;
import org.junit.Test;


public class AnotherTrhustTest {
	
	
	@Test
	public void testNullParent() {
		try {
			Thrust.getSafeParent(null, false);
			Assert.fail("No continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Parent path not found for"));
		}
	}
	
	@Test
	public void listNotDirectory() {
		List<?> files = Thrust.safeListFiles("README.md");
		Assert.assertNotNull(files);
		Assert.assertTrue(files.isEmpty());
	}

}
