package br.com.softbox.tpm.action;

import java.util.List;
import java.util.Optional;

public abstract class AbstractCommandAction extends AbstractAction {
	
	protected final CommandLineParser commandLineParser;
	
	protected AbstractCommandAction(String commandName, CommandLineParser commandLineParser) {
		super(commandName);
		this.commandLineParser = commandLineParser;
	}
	
	protected boolean isArgumentPresent(String arg) {
		return commandLineParser.hasValue(arg);
	}
	
	protected Optional<String> getArgument(String arg) {
		return this.commandLineParser.getArgument(arg);
	}
	
	protected Optional<String> getDefaultArgument() {
		return this.commandLineParser.getDefaultArgument();
	}
	
	protected Optional<String> getPathArgument() {
		return this.commandLineParser.getParameterPath();
	}
	
	@Override
	public void process(List<String> args) {
		this.commandLineParser.parse(args);
		if (commandLineParser.hasHelp()) {
			processHelp();
		} else {
			processAction();
		}
	}

	protected abstract void processHelp();	
	protected abstract void processAction();

}
