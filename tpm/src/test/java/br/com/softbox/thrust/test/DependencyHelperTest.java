package br.com.softbox.thrust.test;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.BriefFile;
import br.com.softbox.tpm.brief.Dependency;
import br.com.softbox.tpm.brief.DependencyHelper;
import br.com.softbox.tpm.brief.Jar;

public class DependencyHelperTest {

	@Test
	public void testAddDependencyNullDependency() {
		BriefFile briefFile = null;
		Dependency dependency = null;

		boolean ok = DependencyHelper.addDependency(briefFile, dependency);
		Assert.assertFalse(ok);
	}

	@Test
	public void testAddDependencyNullBriefFileFromJar() {
		BriefFile briefFile = null;
		Dependency dependency = new Jar("org:java:13547");

		try {
			DependencyHelper.addDependency(briefFile, dependency);
			Assert.fail("How could run this?!");
		} catch (NullPointerException e) {
			Assert.assertNotNull(e.getMessage());
		}
	}

	@Test
	public void testAddDependencyNullBriefFileFromBitcode() {
		BriefFile briefFile = null;
		Dependency dependency = new Bitcode("fab/database");

		try {
			DependencyHelper.addDependency(briefFile, dependency);
			Assert.fail("How could run this?!");
		} catch (NullPointerException e) {
			Assert.assertNotNull(e.getMessage());
		}
	}

	@Test
	public void testAddDependency2Bitcodes() {
		List<Bitcode> bitcodes = Arrays.asList(new Bitcode("oz/database"), new Bitcode("database"));
		BriefFile briefFile = BriefFile.buildSample();
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 0);
		bitcodes.forEach(d -> addDependencyValidating(briefFile, d));
		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 2);
	}

	@Test
	public void testAddDependency2SameBitcodes() {
		List<Bitcode> bitcodes = Arrays.asList(new Bitcode("database"), new Bitcode("database"));
		BriefFile briefFile = BriefFile.buildSample();
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 0);

		boolean ok = DependencyHelper.addDependency(briefFile, bitcodes.get(0));
		Assert.assertTrue(ok);

		ok = DependencyHelper.addDependency(briefFile, bitcodes.get(1));
		Assert.assertFalse(ok);

		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 1);
	}

	@Test
	public void testAddDependency2SameBitcodesDiferenVersions() {
		List<Bitcode> bitcodes = Arrays.asList(new Bitcode("database@old"), new Bitcode("database@new"));
		BriefFile briefFile = BriefFile.buildSample();
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 0);

		bitcodes.forEach(bc -> addDependencyValidating(briefFile, bc));

		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 1);
	}

	@Test
	public void testAddDependency2DiffJars() {
		List<Jar> bitcodes = Arrays.asList(new Jar("org:a:1"), new Jar("org:b:1"));
		BriefFile briefFile = BriefFile.buildSample();
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 0);
		bitcodes.forEach(d -> addDependencyValidating(briefFile, d));
		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 2);
		List<Jar> jars = DependencyHelper.filter(dependencies, Jar.class);
		Assert.assertEquals(jars.size(), 2);
	}

	@Test
	public void testAddDependency2SameJarsSameVersion() {
		boolean ok;
		List<Dependency> dependencies;

		BriefFile briefFile = BriefFile.buildSample();

		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 0);

		final String jarName = "oz:ir:1";

		ok = DependencyHelper.addDependency(briefFile, new Jar(jarName));
		Assert.assertTrue(ok);

		ok = DependencyHelper.addDependency(briefFile, new Jar(jarName));
		Assert.assertFalse(ok);

		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 1);
		List<Jar> jars = DependencyHelper.filter(dependencies, Jar.class);
		Assert.assertEquals(jars.size(), 1);

		Jar jar = jars.get(0);
		Assert.assertNotNull(jar);
		String reference = jar.getReference();
		Assert.assertNotNull(reference);
		Assert.assertEquals(reference, jarName);
	}

	@Test
	public void testAddDependency2SameJarsDiffVersion() {
		boolean ok;
		List<Dependency> dependencies;

		BriefFile briefFile = BriefFile.buildSample();

		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 0);

		ok = DependencyHelper.addDependency(briefFile, new Jar("oz:air:1"));
		Assert.assertTrue(ok);

		ok = DependencyHelper.addDependency(briefFile, new Jar("oz:air:2"));
		Assert.assertTrue(ok);

		dependencies = briefFile.getDependencies();
		Assert.assertEquals(dependencies.size(), 1);
		List<Jar> jars = DependencyHelper.filter(dependencies, Jar.class);
		Assert.assertEquals(jars.size(), 1);
	}

	@Test
	public void testAdd1Bitcode1Jar() {
		boolean ok;

		BriefFile briefFile = BriefFile.buildSample();

		String jarName = "jar:jar:jar";
		ok = DependencyHelper.addDependency(briefFile, DependencyHelper.buildFromResource(jarName));
		Assert.assertTrue(ok);
		briefFile.addDependency(DependencyHelper.buildFromResource(jarName));

		ok = DependencyHelper.addDependency(briefFile,
				DependencyHelper.buildFromResource("bitbucket://fab/death-note@1.8"));
		Assert.assertTrue(ok);

		List<?> list = briefFile.getDependencies();
		Assert.assertNotNull(list);
		Assert.assertFalse(list.isEmpty());
		Assert.assertEquals(list.size(), 2);
		list.stream().map(obj -> obj.toString()).collect(Collectors.joining());

		list = briefFile.getJars();
		Assert.assertNotNull(list);
		Assert.assertFalse(list.isEmpty());
		Assert.assertEquals(list.size(), 1);

		list = briefFile.getBitcodes();
		Assert.assertNotNull(list);
		Assert.assertFalse(list.isEmpty());
		Assert.assertEquals(list.size(), 1);

		Assert.assertNotNull(briefFile.getPath());
	}

	private static void addDependencyValidating(BriefFile briefFile, Dependency dependency) {
		boolean ok = DependencyHelper.addDependency(briefFile, dependency);
		Assert.assertTrue(ok);
	}

}
