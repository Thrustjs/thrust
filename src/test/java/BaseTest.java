import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import org.junit.jupiter.api.BeforeAll;

public abstract class BaseTest {
	protected final static ByteArrayOutputStream outContent = new ByteArrayOutputStream();
	protected final static ByteArrayOutputStream errContent = new ByteArrayOutputStream();
	
	static {
		System.setOut(new PrintStream(outContent));
		System.setErr(new PrintStream(errContent));
	}
	
	@BeforeAll
	protected void setUpStreams() {
		outContent.reset();
		errContent.reset();
	}
}
