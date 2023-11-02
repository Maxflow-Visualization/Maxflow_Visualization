function removeLeadingZeros(inputElement) {
    // Get the current value of the input
    let value = inputElement.value;

    // Remove leading zeros using a regular expression
    value = value.replace(/^0+/, '');

    // Update the input value with the leading zeros removed
    inputElement.value = value;
}
