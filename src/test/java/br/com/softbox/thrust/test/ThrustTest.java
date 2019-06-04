package br.com.softbox.thrust.test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

import br.com.softbox.thrust.core.Thrust;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.PrintStream;
import java.net.URISyntaxException;

public class ThrustTest {
	
	private static ByteArrayOutputStream outContent;
	private static final PrintStream originalOut = System.out;
	
	@BeforeClass
    public static void beforeClass() {
		outContent = new ByteArrayOutputStream();
		System.setOut(new PrintStream(outContent));
		assertTrue(true);
    }
	
	@Before
    public void before() {
		outContent.reset();
		assertTrue(true);
    }
	
    @Test
    public void testRequireConst() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/requireconst/startup.js"});
    	assertEquals("value\n", outContent.toString());
    }
    
    @Test
    public void testRequireFunction() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/requirefunction/startup.js"});
    	assertEquals("value\n", outContent.toString());
    }
    
    @Test
    public void testRequireJSON() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/json/startup.js"});
    	assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testRequireIndexOnFolder() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/indexonfolder/startup.js"});
    	assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testRequireWithJsExtension() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/requirewithjsextension/startup.js"});
    	assertEquals("OK!\n", outContent.toString());
    }
    
    @Test
    public void testRequireThrustBitcode() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/requirethrustbitcode/startup.js"});
    	assertEquals("OK!\n", outContent.toString());
    }
    
    @Test
    public void testRequireInChain() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/requireinchain/startup.js"});
    	assertEquals("OK!\n", outContent.toString());
    }
    
    @Test
    public void testContextIsolation() throws IOException, URISyntaxException {
    	new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/contextisolation/startup.js"});
    	assertEquals("startup.js\n", outContent.toString());
    }
    
    @Test
    public void testScopeIsolation() throws IOException {
    	try {
    		new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/require/scopeisolation/startup.js"});
    		assertTrue(false);
    	} catch(Exception e) {
    		assertEquals("ReferenceError: myVar is not defined", e.getMessage());
    	}
    }
    
    @Test
    public void accessCurrentDir() throws IOException, URISyntaxException {
		new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/general/accesscurrentdir/startup.js"});
		assertEquals(new File(".").getCanonicalPath() + "/src/test/js/general/accesscurrentdir/folder\n", outContent.toString());
    }
    
    @Test
    public void accessRootDir() throws IOException, URISyntaxException {
		new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/general/accessrootdir/startup.js"});
		assertEquals(new File(".").getCanonicalPath() + "/src/test/js/general/accessrootdir\n", outContent.toString());
    }
    
    @Test
    public void testValidConfig() throws IOException, URISyntaxException {
		new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/general/config/validconfig/startup.js"});
		assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testEmptyConfig() throws IOException, URISyntaxException {
		new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/general/config/emptyconfig/startup.js"});
		assertEquals("{}\n", outContent.toString());
    }
    
    @Test
    public void testChangeValidConfig() throws IOException, URISyntaxException {
		new Thrust(new String[] {new File(".").getCanonicalPath() + "/src/test/js/general/config/changevalidconfig/startup.js"});
		assertEquals("thrust\n", outContent.toString());
    }
    
    
    @AfterClass
    public static void afterClass() {
    	System.setOut(originalOut);
    	assertTrue(true);
    }
}
