package br.com.softbox.tpm.action;

import java.util.Arrays;
import java.util.List;

import br.com.softbox.tpm.Tpm;

public class HelpAction extends AbstractAction {
    
    public static final String COMMAND_NAME = "help";

    private static final List<String> HELP = Arrays.asList(
    	"Thrust Package Manager (tpm "+ Tpm.VERSION + ")",
    	"",
        "Usage: tpm <command> [<args>]",
        "",
        "where <command> is one of:",
        "    init, install, help, run",
        "",
        "tpm <command> -h    Quick help on command",
        "tpm init            Create a new Thrust project",
        "tpm install         Install or update dependencies on Thrust project",
        "tpm run             Run a Thrust app",
        "tpm help            Show this help",
        "tpm -version        Show TPM version",
        ""
    );

    public HelpAction() {
        super(COMMAND_NAME);
    }

    @Override
    public void process(List<String> commandArgs) {
    	HELP.forEach(System.out::println);
    }
}