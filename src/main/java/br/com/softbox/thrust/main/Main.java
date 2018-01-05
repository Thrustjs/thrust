package br.com.softbox.thrust.main;

import java.util.List;
import java.util.concurrent.Callable;

import br.com.softbox.thrust.main.cli.MainCLI;
import picocli.CommandLine;
import picocli.CommandLine.ExecutionException;
import picocli.CommandLine.ParameterException;

public class Main {
	public static void main(String[] args) throws Exception {
		MainCLI cli = new MainCLI();
		CommandLine top = new CommandLine(cli);
		cli.setCommandLine(top);

		List<CommandLine> parsedCommands;

		try {
			parsedCommands = top.parse(args);
		} catch (ParameterException ex) {
			System.err.println(ex.getMessage());
			ex.getCommandLine().usage(System.err);
			return;
		}

		for (CommandLine parsed : parsedCommands) {
			if (parsed.isUsageHelpRequested()) {
				parsed.usage(System.err);
				return;
			} else if (parsed.isVersionHelpRequested()) {
				parsed.printVersionHelp(System.err);
				return;
			}
		}

		Object last = parsedCommands.get(parsedCommands.size() - 1).getCommand();

		try {
			if (last instanceof Runnable) {
				((Runnable) last).run();
			} else if (last instanceof Callable) {
				((Callable<?>) last).call();
			} else {
				throw new ExecutionException(top, "Not a Runnable or Callable");
			}
		} catch (ExecutionException ex) {
			ex.getCommandLine().usage(System.err);
		}
	}
}
