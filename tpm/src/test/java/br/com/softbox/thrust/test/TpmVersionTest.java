package br.com.softbox.thrust.test;

import org.junit.Test;

public class TpmVersionTest extends AbstractTpmTest {
	
	@Test
	public void testVersionV() {
		tpmMain("-v");
	}
	
	@Test
	public void testVersionVersion() {
		tpmMain("--version");
	}

}
