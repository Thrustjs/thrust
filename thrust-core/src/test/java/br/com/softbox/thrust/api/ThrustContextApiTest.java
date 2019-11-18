package br.com.softbox.thrust.api;

import java.io.InputStream;

import org.junit.Assert;
import org.junit.Test;

public class ThrustContextApiTest {
	
	@Test
	public void getNullResourceItCan() {
		InputStream in = ThrustContextAPI.getResourceStream("no-resource", true);
		Assert.assertNull(in);
	}
	
	@Test(expected = RuntimeException.class)
	public void getNullResourceCannotBeNull() {
		ThrustContextAPI.getResourceStream("no-resource", false);
	}
	
	@Test
	public void setThreadContext() {
		final String name = "ctx-ex1";
		int base = 1;
		ThrustContextAPI.setValue(name, base);
		
		Integer i = ThrustContextAPI.getValue(name);
		Assert.assertNotNull(i);
		Assert.assertEquals(i.intValue(), base);
		
		
	}

}
