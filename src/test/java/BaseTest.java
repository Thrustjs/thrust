import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import org.junit.jupiter.api.BeforeAll;

public abstract class BaseTest {
	protected final ByteArrayOutputStream outContent = new ByteArrayOutputStream();
	protected final ByteArrayOutputStream errContent = new ByteArrayOutputStream();

	protected PrintStream origErrOut;
	protected PrintStream origOut;

	@BeforeAll
	protected void setUpStreams() {
		origOut = System.out;
		origErrOut = System.err;

		System.setOut(new PrintStream(errContent) {
			@Override
			public void println(Object x) {
				origErrOut.println(x);
				super.println(x);
			}
			
			@Override
			public void print(String x) {
				origErrOut.print(x);
				super.println(x);
			}
		});
		
		System.setOut(new PrintStream(outContent));
	}
}

