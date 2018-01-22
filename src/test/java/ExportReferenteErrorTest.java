import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
public class ExportReferenteErrorTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/ExportReferenteError/index.js"});
		assertEquals("[ERROR] An error was throw executing: /home/bruno/git/thrust/src/test/resources/ExportReferenteError/./bitcode.js\nReferenceError: \"funcNaoExistente\" is not defined\n", outContent.toString());
	}
}


