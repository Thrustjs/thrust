package br.com.softbox.thrust.test;

import java.util.Arrays;
import java.util.Optional;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.action.CommandLineParser;

public class CommandLineParserTest {

	private CommandLineParser cmdParser;

	void parse(String... args) {
		cmdParser.parse(Arrays.asList(args));
	}

	Optional<String> getDefaultArgument() {
		return cmdParser.getDefaultArgument();
	}

	Optional<String> getArgument(String key) {
		return cmdParser.getArgument(key);
	}

	boolean isPresent(String key) {
		return getArgument(key).isPresent();
	}

	@Test
	public void testDefaultNullCommand() {
		cmdParser = CommandLineParser.builder().defaultParameter().done();
		parse();
		Optional<String> opt = getDefaultArgument();
		Assert.assertNotNull(opt);
		Assert.assertFalse(opt.isPresent());
	}

	@Test
	public void testDefaultNotNullCommand() {
		cmdParser = CommandLineParser.builder().defaultParameter().done();
		String arg1 = "hi";
		parse(arg1);
		Optional<String> opt = getDefaultArgument();
		Assert.assertNotNull(opt);
		Assert.assertTrue(opt.isPresent());
		Assert.assertEquals(opt.get(), arg1);
	}

	@Test
	public void testOneParameterValue() {
		final String param1Name = "p1";
		final String param1 = "-p";
		cmdParser = CommandLineParser.builder().add(param1Name, param1).done();
		String arg1 = "hi";
		parse(param1, arg1);
		Optional<String> opt = getArgument(param1Name);
		Assert.assertNotNull(opt);
		Assert.assertTrue(opt.isPresent());
		Assert.assertEquals(opt.get(), arg1);
	}

	@Test
	public void testOneParameterValueMissing() throws Exception {
		final String param1Name = "p1";
		final String param1 = "-p";
		cmdParser = CommandLineParser.builder().add(param1Name, param1).done();
		try {
			parse(param1);
			throw new Exception("How ??");
		} catch (RuntimeException e) {
			Assert.assertNotNull(e.getMessage());
			Assert.assertTrue(e.getMessage().contains("Missing value for parameter"));
		}
	}

	@Test
	public void testOneParameterValueWithDefaultPre() throws Exception {
		final String param1Name = "p1";
		final String param1 = "-p";
		final String param1value = "value";
		final String defaultValue = "some value";
		cmdParser = CommandLineParser.builder().add(param1Name, param1).defaultParameter().done();
		parse(param1, param1value, defaultValue);
		Optional<String> opt = getArgument(param1Name);
		Assert.assertNotNull(opt);
		Assert.assertTrue(opt.isPresent());
		Assert.assertEquals(opt.get(), param1value);
		opt = getDefaultArgument();
		Assert.assertNotNull(opt);
		Assert.assertTrue(opt.isPresent());
		Assert.assertEquals(opt.get(), defaultValue);
	}

	@Test
	public void testOneParameterSinglePresent() {
		final String param1Name = "p1";
		final String param1 = "-f";
		cmdParser = CommandLineParser.builder().add(param1Name, true, param1).done();
		parse(param1);
		boolean ok = isPresent(param1Name);
		Assert.assertTrue(ok);
	}

	@Test
	public void testOneParameterSingleNotPresent() {
		final String param1Name = "p1";
		final String param1 = "-f";
		cmdParser = CommandLineParser.builder().add(param1Name, true, param1).done();
		parse();
		boolean ok = isPresent(param1Name);
		Assert.assertFalse(ok);
	}

	@Test
	public void testNoDefaultNoArgument() {
		cmdParser = CommandLineParser.builder().done();
		parse();
		Optional<String> opt = cmdParser.getDefaultArgument();
		Assert.assertNotNull(opt);
		Assert.assertFalse(opt.isPresent());
	}

	@Test
	public void testNoDefaultAnArgument() throws Exception {
		cmdParser = CommandLineParser.builder().done();
		try {
			parse("ops");
			throw new Exception("Help me!");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("No default argument"));
		}
	}

	@Test
	public void testIsPresent() throws Exception {
		final String paramName = "p";
		final String paramPre = "--p";
		final String paramValue = "value";

		cmdParser = CommandLineParser.builder().add(paramName, paramPre).done();
		parse();
		Assert.assertFalse(cmdParser.hasValue(paramName));
		Assert.assertFalse(cmdParser.getArgument(paramName).isPresent());

		cmdParser = CommandLineParser.builder().add(paramName, paramPre).done();
		parse(paramPre, paramValue);
		Assert.assertTrue(cmdParser.hasValue(paramName));
		Assert.assertTrue(cmdParser.getArgument(paramName).isPresent());
	}

	@Test
	public void testUnexpectedParameter() throws Exception {
		cmdParser = CommandLineParser.builder().add("P", "-p").done();
		try {
			parse("-j");
			throw new Exception("How this?");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Unexpected parameter"));
		}
	}

}
