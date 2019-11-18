package br.com.softbox.thrust.api;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.junit.After;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import br.com.softbox.thrust.core.Thrust;

public class ThrustContextAPIForDebugTest {
	
	private static Class<?> clazz;
	private static Field field;
	
	@BeforeClass
	public static void prepareToTest() throws Exception {
		
		clazz = Class.forName("br.com.softbox.thrust.api.ThrustContextAPI");
		Assert.assertNotNull(clazz);
		
		field = clazz.getDeclaredField("DEBUG_PORT"); 
		Assert.assertNotNull(field);
		field.setAccessible(true);
		
		Field mf = Field.class.getDeclaredField("modifiers");
		mf.setAccessible(true);
		mf.setInt(field, field.getModifiers() & ~Modifier.FINAL);
		
		field.set(null, -1);
		
	}
	
	@After
	public void afterTest() throws Exception {
		field.set(null, -1);
	}
	
	
	@Test
	public void testThrustDebug() throws Exception {
		Path path = Paths.get("src/test/js/general", "helloworld.js");
		Thrust.main(new String[] { "-debug", path.toString()});
	}

}
