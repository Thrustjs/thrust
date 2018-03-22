import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;



@TestInstance(Lifecycle.PER_CLASS)
public class ExportReferenteErrorTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/ExportReferenteError/index.js"});
		String expected = "ReferenceError: \"funcNaoExistente\" is not defined";
		assertTrue(outContent.toString().contains(expected));
	}
}


