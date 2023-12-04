import React, {useRef, useState} from 'react';
import {View, Text, Dimensions, ScrollView} from 'react-native';
import Modal from 'react-native-modal';
import FloatingTextInput from '../../../containers/FloatingTextInput';
import I18n from '../../../i18n';

import styles from './style';
import Button from '../../../containers/Button';
import { CsSelect } from '../../../containers/CsSelect';
import KeyboardView from '../../../containers/KeyboardView';
import { showToast } from '../../../lib/info';
import scrollPersistTaps from '../../../utils/scrollPersistTaps';

const theme = 'light';
const { width, height } = Dimensions.get('window');

const AddExperienceModal = ({isVisible, onBackdropPress, onUpdate}) => {

  const [job, setJob] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [yearsOfService, setYearsOfService] = useState('');
  const [salary, setSalary] = useState('');
  const services = ['0 - 5 years', '5 - 10 years', '10 - 15 years', '15 - 25 years', 'Over 30 years'];
  const salleries = ['$0-$50,000', '$50,000-$80,000', '$80,000-$100,000', '$100,000-$500,000', '$500,000-$1,000,000', 'Over $1,000,000'];

  const jobInput = useRef(null);
  const roleInput = useRef(null);
  const companyInput = useRef(null);

  const onSubmit = () => {
    if (!job) {
      jobInput.current.focus();
      return
    }

    if (!company) {
      companyInput.current.focus();
      return
    }

    if (!role) {
      roleInput.current.focus();
      return
    }

    if (!yearsOfService) {
      showToast(I18n.t('please_select_years_service'));
      return
    }

    if (!salary) {
      showToast(I18n.t('please_select_sallery'));
      return
    }

    onUpdate(job, company, role, yearsOfService, salary);
  };

  return (
    <Modal 
      isVisible={isVisible} 
      animationInTiming={400}                
      onBackButtonPress={onBackdropPress}
      onBackdropPress={onBackdropPress}
      style={styles.modal_container}
      deviceWidth={width}
      deviceHeight={height}
      propagateSwipe={true}
      backdropOpacity={0.7}>

      <View style={styles.container}>
        <KeyboardView keyboardVerticalOffset={128}>
          <Text style={styles.title}>{I18n.t('add_experience')}</Text>
          <Text style={styles.descriptionText}>{I18n.t('premium_detail')}</Text>
          <View style={{height: 15}}/>
          
          <FloatingTextInput
            inputRef={jobInput}
            value={job}
            returnKeyType="next"
            keyboardType="default"
            textContentType="oneTimeCode"
            label={I18n.t('Job')}
            placeholder={I18n.t('type_job')}
            onChangeText={val => setJob(val)}
            theme={theme}
            onSubmitEditing={() => {
              companyInput.current.focus();
            }}
          />
          <FloatingTextInput
            inputRef={companyInput}
            value={company}
            returnKeyType="next"
            keyboardType="default"
            textContentType="oneTimeCode"
            label={I18n.t('Company')}
            placeholder={I18n.t('enter_company')}
            onChangeText={val => setCompany(val)}
            theme={theme}
            onSubmitEditing={() => {
              roleInput.current.focus();
            }}
          />
          <FloatingTextInput
            inputRef={roleInput}
            value={role}
            returnKeyType="next"
            keyboardType="default"
            textContentType="oneTimeCode"
            label={I18n.t('Role')}
            placeholder={I18n.t('type_role')}
            onChangeText={val => setRole(val)}
            theme={theme}
          />
          <CsSelect
            placeholder={I18n.t('select')}
            label={I18n.t('Years_of_service')}
            options={services}
            onSelect={(value)=>setYearsOfService(value)}
            theme={theme}
            value={yearsOfService}
          />
          <CsSelect
            placeholder={I18n.t('select_sallery')}
            label={I18n.t('sallery')}
            options={salleries}
            theme={theme}
            value={salary}
            onSelect={(value)=>setSalary(value)}
          />
          <Button
            style={styles.submitBtn}
            title={I18n.t('update')}
            size="W"
            onPress={onSubmit}
            testID="login-submit"
            theme={theme}
            pressingHighlight
          />
          <View style={{height: 20}}/>
        </KeyboardView>
      </View>
    </Modal>
  );
};

export default AddExperienceModal;
