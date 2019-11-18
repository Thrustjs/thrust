package br.com.softbox.thrust.test;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.brief.Jar;
import br.com.softbox.tpm.brief.JarCache;
import br.com.softbox.tpm.brief.Dependency;
import br.com.softbox.tpm.brief.DependencyCache;
import br.com.softbox.tpm.brief.DependencyHelper;

public class JarTest {

	@Test
	public void compareJars() {

		Jar jar1 = (Jar) DependencyHelper.buildFromResource("postgres:postgres:1.1");
		Jar jar2 = (Jar) DependencyHelper.buildFromResource("postgres:postgres:1.1 ");
		Jar jar3 = (Jar) DependencyHelper.buildFromResource("postgres:postgres:1.2");
		Jar jar4 = (Jar) DependencyHelper.buildFromResource(":postgres:");
		Jar jar5 = (Jar) DependencyHelper.buildFromResource(":postgres.jar:");
		Dependency bitcode = DependencyHelper.buildFromResource("postgres/postgres@1.1");
		List<Jar> jars = Arrays.asList(jar1, jar2, jar3, jar4, jar5);
		Path path = Paths.get(".");
		for (Jar jar : jars) {

			Assert.assertNotNull(jar.getArtifact());
			Assert.assertNotNull(jar.getGroup());
			Assert.assertNotNull(jar.getName());
			Assert.assertNotNull(jar.getReference());
			Assert.assertNotNull(jar.getVersion());
			Assert.assertNotNull(jar.toString());
			if (jar.isLocal()) {
				Assert.assertTrue(jar.getVersion().isEmpty());
				Assert.assertNull(jar.getPomName());
			} else {
				Assert.assertNotNull(jar.getPomName());
				Assert.assertFalse(jar.getVersion().isEmpty());
			}
			Assert.assertFalse(jar.isSame(null));
			Assert.assertFalse(jar.isSame(bitcode));

			Assert.assertFalse(jar.isSameVersion(null));
			Assert.assertFalse(jar.isSameVersion(bitcode));

			Assert.assertFalse(jar.equals(null));
			Assert.assertFalse(jar.equals(bitcode));

			Assert.assertTrue(jar.hashCode() != 0);

			DependencyCache cache = new JarCache(jar, path);
			cache.isSameVersion(jar);
			cache.isSameVersion(jar1);
			cache.isSameVersion(jar2);
			cache.isSameVersion(null);

		}

		Assert.assertTrue(jar1.isSame(jar1));
		Assert.assertTrue(jar1.isSame(jar2));
		Assert.assertTrue(jar1.isSame(jar3));
		Assert.assertFalse(jar1.isSame(jar4));
		Assert.assertFalse(jar1.isSame(jar5));

		Assert.assertTrue(jar1.equals(jar1));
		Assert.assertTrue(jar1.equals(jar2));
		Assert.assertFalse(jar1.equals(jar3));
		Assert.assertFalse(jar1.equals(jar4));
		Assert.assertFalse(jar1.equals(jar5));

		Assert.assertTrue(jar5.isLocal());
		Assert.assertTrue(jar4.isLocal());
		Assert.assertFalse(jar3.isLocal());
		Assert.assertFalse(jar2.isLocal());
		Assert.assertFalse(jar1.isLocal());

	}

	@Test
	public void failNewJarFromInvalidJarReference() throws Exception {
		try {
			new Jar("org:softbox:jar:1.5");
			throw new Exception("Fail me");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Invalid jar reference"));
		}
	}

	@Test
	public void isJar() throws Exception {
		Assert.assertFalse(Jar.isJar("ref"));
		Assert.assertFalse(Jar.isJar("ref:ab"));
		Assert.assertFalse(Jar.isJar("ref:a:b:c"));
		Assert.assertFalse(Jar.isJar("ref:a@c"));
		Assert.assertFalse(Jar.isJar("ref:a:b@c"));
	}
	
	@Test
	public void testNoGroup() throws Exception {
		try {
			new Jar(":jar:jar");
			throw new Exception("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("You must inform both the group"));
		}
	}
	
	@Test
	public void testNoVersion() throws Exception {
		try {
			new Jar("jar:jar:");
			throw new Exception("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("You must inform both the group"));
		}
	}

}
