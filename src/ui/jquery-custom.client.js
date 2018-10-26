$.fn.invalidFields = function()
{
    var allFields = this.find('input[required], select[required]');
    return allFields.filter(function(index, el) {
        return $(el).val() === '';
    });
};
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
/**
 * Temporarily disable submit behaviour on a form's submit button(s)
 *
 * @returns {{}}
 */
$.fn.disableSubmit = function(tempLabel)
{
    var $buttons = $([]), $inputs = $([]), tagName = this[0].tagName.toLocaleLowerCase();
    tempLabel = tempLabel || 'Processing';
    if (tagName === 'input') {
        $inputs = this;
    } else if (tagName === 'button') {
        $buttons = this;
    } else {
        $inputs = this.find('input[type="submit"]');
        $buttons = this.find('button[type="submit"]');
    }
    $buttons.attr('data-orig-value', $buttons.html()).html(tempLabel).prop('disabled', true);
    $inputs.attr('data-orig-value', $buttons.val()).val(tempLabel).prop('disabled', true);
    return this;
};
$.fn.restoreSubmit = function()
{
    var $buttons = $([]), $inputs = $([]), tagName = this[0].tagName.toLocaleLowerCase();
    if (tagName === 'input') {
        $inputs = this;
    } else if (tagName === 'button') {
        $buttons = this;
    } else {
        $inputs = this.find('input[type="submit"]');
        $buttons = this.find('button[type="submit"]');
    }
    $buttons.html($buttons.attr('data-orig-value')).prop('disabled', false);
    $inputs.val($buttons.attr('data-orig-value')).prop('disabled', false);
    return this;
};