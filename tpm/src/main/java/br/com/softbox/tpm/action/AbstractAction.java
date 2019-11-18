package br.com.softbox.tpm.action;

import java.util.List;
import java.util.Objects;

public abstract class AbstractAction {
	protected String commandName;

	protected AbstractAction(String commandName) {
		this.commandName = commandName;
	}

	public boolean canHandle(String command) {
		return Objects.equals(command, commandName);
	}

	public abstract void process(List<String> args);
}