function Validate(formSelector){
    const _this = this;

    // Chứa tất cả các rules cần được xử lý
    var formRules = {
        // fullname: required,
        // email: required, email,
        // ...
    };

    // Lấy ra thẻ cha
    function getParent(element, selector){
        while (element.parentElement){
            if (element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    /**
     * Quy ước tạo ra rule:
     *  - Nếu xảy ra lỗi thì return `error message`
     *  - Nếu không có lỗi thì return `undefined`
     */
    var validateRules = {
        required: function (value){
            return value.trim() ? undefined : 'Please enter this field';
        },
        email: function (value){
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Please enter this field is email';
        },
        phone: function (value){
            const regex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$/im;
            return regex.test(value) ? undefined : 'Please enter this field is phone number';
        },
        min: function (min){
            return function (value){
                return value.length >= min ? undefined : `Please enter at least ${min} characters`;
            }
        },
        max: function (max){
            return function (value){
                return value.length <= max ? undefined : `Please enter at least ${max} characters`;
            }
        },
        confirmed: function (value) {
            var getConfirmValue = document.querySelector(`${formSelector} #password`).value;
            return value === getConfirmValue ? undefined : 'Re-entered password does not match';
        }
    }

    // Lấy ra form element trong DOM thoe `formSelector`
    const formElement = document.querySelector(formSelector);

    // Chỉ xử lý khi có element trong DOM
    if ( formElement){
        // Lấy tất cả các thẻ có 2 thuộc tính name và rules
        var inputs = document.querySelectorAll('[name][rules]');
        for (var input of inputs){
            var rules = input.getAttribute('rules').split('|')
            for (var rule of rules){
                var ruleInfo;
                const isRuleHasValue = rule.includes(':');

                if(isRuleHasValue){
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                    // ruleInfo[0]: email
                    // ruleInfo[1]: min
                }

                var ruleFunc = validateRules[rule];

                if(isRuleHasValue){
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if(Array.isArray(formRules[input.name])){
                    formRules[input.name].push(ruleFunc);
                }
                else{
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (blur, change, input)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm thực hiện Validate
        function handleValidate(event){
            // event.target.value: Gía trị điền vào ô input
            // event.target.name: tên (fullname, email, password...)
            var rules = formRules[event.target.name];
            var errorMessage;
            for( var rule of rules){
                errorMessage = rule(event.target.value);
                if(errorMessage) break;
            }

            // Nếu có lỗi thì hiển thị lỗi ra UI
            if (errorMessage){
                var formGroup = getParent(event.target, '.form-group');
                if (formGroup) {
                    formGroup.classList.add('invalid');
                    var formMessage = formGroup.querySelector('.form-message');
                    if ( formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        // Clear message lỗi
        function handleClearError(event){
            var formGroup = getParent(event.target, '.form-group');
            
            if(formGroup.classList.contains('invalid')){
                formGroup.classList.remove('invalid')

                var formMessage = formGroup.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }
    }

    // Xử lý hành vi Submit form
    formElement.onsubmit = function (event){
        // Ngăn chặn hành vi submit mặc định
        event.preventDefault();

        var inputs = document.querySelectorAll('[name][rules]');
        var isValid = true;

        for (var input of inputs){
            // Nếu mà xảy ra lỗi thì isValid = false
            if (!handleValidate({ target: input })){
                isValid = false;
            }
        }

        // Khi không có lỗi thì submit form
        if (isValid) {
            // Nếu có hàm xử lý submit thì sử dụng hàm submit
            if (typeof _this.onSubmit === 'function'){
                var enableInputs = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }

                        return values;
                    }, {});
                    // Gọi lại hàm onSubmit và trả về các giá trị của form
                    _this.onSubmit(formValues);
            }
            // Nếu không tồn tại hàm xử lý submit thì sử dụng hàm submit mặc định của form
            else{
                formElement.submit();
            }
        }
    }

    // console.log(formRules)
}