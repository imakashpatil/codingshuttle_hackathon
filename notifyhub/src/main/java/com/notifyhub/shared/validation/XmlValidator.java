package com.notifyhub.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;

public class XmlValidator implements ConstraintValidator<ValidXML, String> {

    @Override
    public boolean isValid(
            String value,
            ConstraintValidatorContext context) {

        if (value == null || value.isBlank()) {
            return false;
        }

        try {
            DocumentBuilderFactory factory =
                    DocumentBuilderFactory.newInstance();

            factory.setNamespaceAware(true);

            factory.newDocumentBuilder().parse(
                    new InputSource(
                            new StringReader(value)
                    )
            );

            return true;

        } catch (Exception exception) {
            context.disableDefaultConstraintViolation();

            context.buildConstraintViolationWithTemplate(
                    "Invalid XML payload format: " +
                            exception.getMessage()
            ).addConstraintViolation();

            return false;
        }
    }
}
