package br.com.softbox.thrust.test;

import org.junit.Test;

public class HelpTest extends AbstractTpmTest {

	@Test
	public void helpCall() {
		tpmHelp();
	}

	@Test
	public void showHelpFromInvalidCommand() {
		final String javaLibraryPathProperty = "java.library.path";
		final String javaLibraryPathValue = System.getProperty(javaLibraryPathProperty);
		System.setProperty(javaLibraryPathProperty, "");
		try {
			tpmMain("invalid-call");
		} finally {
			System.setProperty(javaLibraryPathProperty, javaLibraryPathValue);
		}
	}

	@Test
	public void showHelpForInit() {
		tpmMain("init", "-h");
	}

	@Test
	public void showHelpForInstall() {
		tpmMain("install", "--help");
	}

	@Test
	public void showHelpForRun() {
		tpmMain("run", "-h");
	}
	
	@Test
	public void callNoArgs() {
		tpmMain();
	}
	
	@Test
	public void call1stJs() {
		tpmMain("a.js");
	}

}
