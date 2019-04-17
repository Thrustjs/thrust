package br.com.softbox.thrust.test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import org.junit.Test;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.PrintStream;

import br.com.softbox.thrust.Thrust;

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
    public void testRequireConst() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/requireconst/startup.js");
    	assertEquals("value\n", outContent.toString());
    }
    
    @Test
    public void testRequireFunction() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/requirefunction/startup.js");
    	assertEquals("value\n", outContent.toString());
    }
    
    @Test
    public void testRequireJSON() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/json/startup.js");
    	assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testRequireIndexOnFolder() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/indexonfolder/startup.js");
    	assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testRequireWithJsExtension() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/requirewithjsextension/startup.js");
    	assertEquals("OK!\n", outContent.toString());
    }
    
    @Test
    public void testRequireThrustBitcode() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/requirethrustbitcode/startup.js");
    	assertEquals("OK!\n", outContent.toString());
    }
    
    @Test
    public void testRequireInChain() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/requireinchain/startup.js");
    	assertEquals("OK!\n", outContent.toString());
    }
    
    @Test
    public void testContextIsolation() throws IOException {
    	new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/contextisolation/startup.js");
    	assertEquals("startup.js\n", outContent.toString());
    }
    
    @Test
    public void testScopeIsolation() throws IOException {
    	try {
    		new Thrust(new File(".").getCanonicalPath() + "/resources/test/require/scopeisolation/startup.js");
    		assertTrue(false);
    	} catch(Exception e) {
    		assertEquals("ReferenceError: myVar is not defined", e.getMessage());
    	}
    }
    
    @Test
    public void accessThrustAPI() throws IOException {
		new Thrust(new File(".").getCanonicalPath() + "/resources/test/general/accessthrustapi/startup.js");
		assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testValidConfig() throws IOException {
		new Thrust(new File(".").getCanonicalPath() + "/resources/test/general/config/validconfig/startup.js");
		assertEquals("true\n", outContent.toString());
    }
    
    @Test
    public void testEmptyConfig() throws IOException {
		new Thrust(new File(".").getCanonicalPath() + "/resources/test/general/config/emptyconfig/startup.js");
		assertEquals("{}\n", outContent.toString());
    }
    
    @Test
    public void testChangeValidConfig() throws IOException {
		new Thrust(new File(".").getCanonicalPath() + "/resources/test/general/config/changevalidconfig/startup.js");
		assertEquals("thrust\n", outContent.toString());
    }
    
    
    @AfterClass
    public static void afterClass() {
    	System.setOut(originalOut);
    	assertTrue(true);
    }
}
