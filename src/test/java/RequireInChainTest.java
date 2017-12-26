import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
/*
 * @Description("Tests index.js requiring bitcode.js that requires bitcode2.js")
 */
public class RequireInChainTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/RequireInChain/index.js"});
		assertEquals("index.js\nBitcode loaded!\nBitcode2 loaded!\n", outContent.toString());
	}
}
