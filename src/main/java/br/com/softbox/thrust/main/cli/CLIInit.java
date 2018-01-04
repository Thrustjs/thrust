package br.com.softbox.thrust.main.cli;

import java.io.File;

import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

@Command(name = "init",
	sortOptions = false,
	description = "Use init to create a new project")
public class CLIInit implements Runnable {

	@Option(names = { "-h", "--help" }, usageHelp = true, description = "Help do init.")
	private boolean helpRequested = false;
	
	@Parameters(arity="0", paramLabel = "path", description = "Path to create a new Thrust application.")
	File path;

	@Override
	public void run() {
		if (path == null) {
			path = new File(".");
		}
		
		System.out.println("Executing init on " + path.getAbsolutePath());
	}
}
