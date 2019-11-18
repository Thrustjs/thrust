package br.com.softbox.tpm.action;

import java.util.ArrayList;
import java.util.List;

class ArgumentDefinition {

	final String parameterName;
	final boolean single;
	final List<String> predecessors;
	final List<String> values;

	ArgumentDefinition(String name, boolean single, List<String> predecessors) {
		this.parameterName = name;
		this.predecessors = predecessors;
		this.single = single;
		this.values = new ArrayList<>();
	}

	void addValue(String value) {
		values.add(value);
	}

	boolean hasValue() {
		return !values.isEmpty();
	}

	public String getFirstValue() {
		return hasValue() ? values.get(0) : null;
	}

	boolean hasPredecessor(String predecessor) {
		return predecessors.stream().anyMatch(p -> p.equals(predecessor));
	}

	void clear() {
		this.values.clear();
	}

}
