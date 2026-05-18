import React from 'react';
import {
    TextInput
} from 'react-native';
import I18nUtil from '../util/I18nUtil';
import Theme from '../res/styles/Theme';

export default class CustomeTextInput extends React.Component {

    render() {
        const {placeholder,style} = this.props;
        return (
            <TextInput  ref={component=>this._root=component} 
                        {...this.props} 
                        returnKeyType="done" 
                        placeholder ={I18nUtil.translate(placeholder)} 
                        placeholderTextColor={Theme.promptFontColor} 
                        style={[{ backgroundColor: 'transparent' }, style]}          
            />
        )
    }
}
