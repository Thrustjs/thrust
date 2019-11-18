package br.com.softbox.tpm.action;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class CommandLineParser {
	protected static final String PARAMETER_DEFAULT = "DEFAULT";
	protected static final String PARAMETER_HELP = "__HELP__";
	protected static final String PARAMETER_PATH=  "__PATH__";
	
	private List<ArgumentDefinition> argumentsDefinition;

	public CommandLineParser(List<ArgumentDefinition> argumentsDefinition) {
		this.argumentsDefinition = argumentsDefinition;
	}

	private Optional<ArgumentDefinition> findArgumentByPredecessor(String predecessor) {
		return argumentsDefinition.stream().filter(cmdDef -> cmdDef.hasPredecessor(predecessor)).findFirst();
	}

	private Optional<ArgumentDefinition> findArgumentByName(String name) {
		return argumentsDefinition.stream().filter(cmdDef -> cmdDef.parameterName.equals(name)).findFirst();
	}

	private Optional<ArgumentDefinition> findDefaultArgument() {
		return findArgumentByName(PARAMETER_DEFAULT);
	}
	
	public void clear() {
		this.argumentsDefinition.forEach(this::clear);
	}
	
	private void clear(ArgumentDefinition argDef) {
		argDef.clear();
	}

	public void parse(List<String> args) {
		String arg;
		final int n = args.size();
		int index = 0;
		Optional<ArgumentDefinition> optArgDef;
		ArgumentDefinition argDef;

		clear();
		while (index < n) {
			arg = args.get(index);
			index++;
			if (arg.startsWith("-")) {
				optArgDef = findArgumentByPredecessor(arg);
				if (!optArgDef.isPresent()) {
					throw new RuntimeException("Unexpected parameter: " + arg);
				}
				argDef = optArgDef.get();
				if (!argDef.single) {
					if (index >= n) {
						throw new RuntimeException("Missing value for parameter: " + arg);
					}
					argDef.addValue(args.get(index));
					index++;
				} else {
					argDef.addValue("");
				}
			} else {
				optArgDef = findDefaultArgument();
				if (!optArgDef.isPresent()) {
					throw new RuntimeException("No default argument");
				}
				optArgDef.get().addValue(arg);
			}
		}
	}

	public Optional<String> getDefaultArgument() {
		return getArgument(PARAMETER_DEFAULT);
	}
	
	public Optional<String> getParameterPath() {
		return getArgument(PARAMETER_PATH);
	}

	public Optional<String> getArgument(String argumentName) {
		Optional<ArgumentDefinition> opt = findArgumentByName(argumentName);
		String value = null;
		if (opt.isPresent()) {
			value = opt.get().getFirstValue();
		}
		return Optional.ofNullable(value);
	}
	
	public boolean hasValue(String argumentName) {
		Optional<ArgumentDefinition> opt = findArgumentByName(argumentName);
		return opt.isPresent() && opt.get().hasValue();
	}

	public boolean hasHelp() {
		return hasValue(PARAMETER_HELP);
	}

	public static Builder builder() {
		return new Builder();
	}

	public static class Builder {

		private final List<ArgumentDefinition> argumentsDefinition = new ArrayList<>();

		public Builder defaultParameter() {
			return add(PARAMETER_DEFAULT, true);
		}

		public Builder helpParameter() {
			return add(PARAMETER_HELP, true, "-h", "--help");
		}
		
		public Builder pathParameter() {
			return add(PARAMETER_PATH, "-p", "--path");
		}

		public Builder add(String parameterName, boolean single, String... predecessors) {
			List<String> listPredecessors = Arrays.asList(predecessors);
			argumentsDefinition.add(new ArgumentDefinition(parameterName, single, listPredecessors));
			return this;
		}

		public Builder add(String parameterName, String... predecessors) {
			return add(parameterName, false, predecessors);
		}

		public List<ArgumentDefinition> build() {
			return argumentsDefinition;
		}

		public CommandLineParser done() {
			return new CommandLineParser(build());
		}
	}

}