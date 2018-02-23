import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
public class RequireFunctionTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/RequireFunction/index.js"});
		assertEquals("function called with argTest\n", outContent.toString());
	}
}
