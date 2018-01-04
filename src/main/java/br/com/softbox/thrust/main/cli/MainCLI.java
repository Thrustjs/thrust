package br.com.softbox.thrust.main.cli;

import java.io.File;

import br.com.softbox.thrust.core.ThrustCore;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

@Command(
		name = "command",
		description = "Thrust is a fast, scalable, distributed SSJS.",
		subcommands = { CLIInit.class })
public class MainCLI implements Runnable {
	
	@Option(names = { "-h", "--help" }, usageHelp = true, description = "Displays this help message and quits.")
	private boolean helpRequested = false;
	
	@Parameters(arity="*", paramLabel = "mainFile", description = "Main file to be executed.")
	File path;

	private CommandLine cmd;
	
	public void setCommandLine(CommandLine cmd) {
		this.cmd = cmd;
	}

	@Override
	public void run() {
		if (path == null || !path.exists() || path.isDirectory()) {
			System.out.println("You need to specify a valid Javascript file to execute.");
			cmd.usage(System.out);
			return;
		}
		
		try {
			ThrustCore thrustCore = new ThrustCore();
			String mainScript = ThrustCore.require(path.getPath(), true);
			thrustCore.eval(mainScript);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
