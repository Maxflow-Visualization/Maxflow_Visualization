function removeLeadingZeros(inputElement) {
    // Get the current value of the input
    let value = inputElement.value;

    // Remove leading zeros using a regular expression (unless it's a single 0)
    if (!/^(0|[1-9][0-9]*)$/.test(value)) {
        value = '';
    }

    // Update the input value with the leading zeros removed
    inputElement.value = value;
}
