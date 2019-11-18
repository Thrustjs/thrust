package br.com.softbox.thrust.test;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.BriefFile;
import br.com.softbox.tpm.brief.Dependency;
import br.com.softbox.tpm.brief.DependencyHelper;
import br.com.softbox.tpm.brief.Jar;

/**
 * Testes para BriefFile.
 * 
 * @author ozair
 *
 */
public class BriefFileTest {

	@Test
	public void testCreateSample() {
		BriefFile briefFile = BriefFile.buildSample();
		Assert.assertNotNull(briefFile);
		Assert.assertNull(briefFile.getFile());
		Assert.assertNull(briefFile.getRootDirectory());
		Assert.assertNotNull(briefFile.getVersion());
		Assert.assertEquals(briefFile.getVersion(), "0.0.1");
	}

	@Test(expected = NullPointerException.class)
	public void testLoadFromFileNull() throws IOException {
		BriefFile.loadFromFile(null);
	}

	@Test(expected = FileNotFoundException.class)
	public void testLoadFromFileNotFound() throws IOException {
		BriefFile.loadFromFile(Paths.get("somewhere", "anywhere", "nofile").toFile());
	}

	@Test(expected = IllegalArgumentException.class)
	public void testLoadFromFileThatIsDirectory() throws IOException {
		BriefFile.loadFromFile(new File("."));
	}

	@Test
	public void testLoadFromEmptyFile() throws Exception {
		File fBrief = new File("./src/test/resources/empty-file.json");
		try {
			BriefFile.loadFromFile(fBrief);
			Assert.fail("Não pode entrar aqui");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Failed to read JSON file"));
		}
	}

	@Test
	public void testLoadFromCorruptFile() throws Exception {
		File fBrief = new File("./src/test/resources/brief-corrupt.json");
		try {
			BriefFile.loadFromFile(fBrief);
			Assert.fail("Não pode entrar aqui");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Failed to read JSON file"));
		}
	}

	@Test
	public void testLoadFromEmptyJson() throws Exception {
		File fBrief = new File("./src/test/resources/empty-json.json");
		BriefFile briefFile = BriefFile.loadFromFile(fBrief);
		Assert.assertNotNull(briefFile);
		Assert.assertNull(briefFile.getName());
		Assert.assertNull(briefFile.getVersion());
	}

	@Test
	public void testLoadFromOldVersionExpectedToBeAnArray() throws Exception {
		File fBrief = new File("./src/test/resources/brief-old-version.json");
		BriefFile briefFile = BriefFile.loadFromFile(fBrief);
		Assert.assertNotNull(briefFile);
		List<?> list = briefFile.getDependencies();
		Assert.assertNotNull(list);
		Assert.assertFalse(list.isEmpty());
		Assert.assertEquals(list.size(), 1);
		list = briefFile.getJars();
		Assert.assertFalse(list.isEmpty());
		Assert.assertEquals(list.size(), 1);
		list = briefFile.getBitcodes();
		Assert.assertTrue(list.isEmpty());
		Assert.assertEquals(list.size(), 0);
	}

	@Test
	public void testLoadFromEmptyDependencies() throws Exception {
		File fBrief = new File("./src/test/resources/brief-empty-dependencies.json");
		BriefFile briefFile = BriefFile.loadFromFile(fBrief);
		Assert.assertNotNull(briefFile);
		Assert.assertNotNull(briefFile.getName());
		Assert.assertNotNull(briefFile.getVersion());
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertNotNull(dependencies);
		Assert.assertEquals(dependencies.size(), 0);
	}

	@Test
	public void testLoadFromFileDependenciesJarAndBitCode() throws Exception {
		File fBrief = new File("./src/test/resources/brief-dependencies-3.json");
		BriefFile briefFile = BriefFile.loadFromFile(fBrief);
		Assert.assertNotNull(briefFile);
		Assert.assertNotNull(briefFile.getName());
		Assert.assertNotNull(briefFile.getVersion());
		List<Dependency> dependencies = briefFile.getDependencies();
		Assert.assertNotNull(dependencies);
		Assert.assertEquals(dependencies.size(), 3);

		List<Jar> jars = DependencyHelper.filter(dependencies, Jar.class);
		Assert.assertNotNull(jars);
		Assert.assertEquals(jars.size(), 1);

		List<Bitcode> bitcodes = DependencyHelper.filter(dependencies, Bitcode.class);
		Assert.assertNotNull(bitcodes);
		Assert.assertEquals(bitcodes.size(), 2);
	}

	@Test
	public void testLoadFromFileDependenciesIsAnObject() throws Exception {
		File fBrief = new File("./src/test/resources/brief-dependencies-obj.json");
		try {
			BriefFile.loadFromFile(fBrief);
			Assert.fail("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Dependencies must be a string"));
		}
	}

	@Test
	public void testSerializeNullFile() throws Exception {
		try {
			BriefFile bf = BriefFile.buildSample();
			Assert.assertNull(bf.getFile());
			bf.serialize();
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Missing file path"));
			return;
		}
		Assert.fail("Could not run this");
	}

	@Test
	public void testInvalidDependenciesType() throws Exception {
		File fBrief = new File("./src/test/resources/brief-invalid-dependencies-type.json");
		try {
			BriefFile.loadFromFile(fBrief);
			Assert.fail("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Invalid 'dependencies' type"));
		}
	}
	
	@Test
	public void loadFromDirectory() throws Exception {
		File fBrief = new File("./src/test/resources/project01");
		BriefFile briefFile = BriefFile.loadFromFile(fBrief);
		Assert.assertNotNull(briefFile);
		Assert.assertNotNull(briefFile.getName());
		Assert.assertNotNull(briefFile.getVersion());
		Assert.assertNotNull(briefFile.getRootDirectory());
		Assert.assertNotNull(briefFile.getBitcodes());
		Assert.assertNotNull(briefFile.getDependencies());
		Assert.assertNotNull(briefFile.getJars());
		Assert.assertNotNull(briefFile.getPath());
		Assert.assertNotNull(briefFile.toString());
	}

}
