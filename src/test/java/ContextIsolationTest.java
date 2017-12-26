import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
/*
 * @Description("Tests index.js requiring bitcode.js that requires bitcode2.js")
 */
public class ContextIsolationTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/ContextIsolation/index.js"});
		assertEquals("index.js\nundefined\nbitcode.js\nindex.js\n", outContent.toString());
	}
}
