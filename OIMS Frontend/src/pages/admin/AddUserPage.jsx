import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import api from '../../api/axiosClient';
import { 
  Box, Stepper, Step, StepLabel, Button, Typography, 
  TextField, MenuItem, Paper, CircularProgress, 
  FormControlLabel, Checkbox, FormGroup, Alert, Snackbar
} from '@mui/material';

const steps = ['Identity & System', 'Personal Details', 'Employment', 'Qualifications'];

const qualificationsList = [
  'GCE_OL', 'GCE_AL', 'Diploma', 'Higher_Diploma', 
  'Professional_Qualification', 'Degree', 'Masters', 'PHD'
];

const AddUserPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, trigger, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      email: '', password: '', role: 'EMPLOYEE', employeeNo: '', epfNo: '', fingerPrintId: '',
      firstName: '', lastName: '', nicNo: '', dob: '', gender: '', maritalStatus: '',
      nationality: '', address: '', district: '', mobileNo: '',
      dateJoined: '', employeeType: 'PERMANENT', department: 'GENERAL_ADMIN', 
      jobCategory: 'CLERICAL_ALLIED', jobTitle: 'Clerk', grade: 'NA',
      qualifications: [] // array of strings
    }
  });

  const handleNext = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate = [];
    if (activeStep === 0) fieldsToValidate = ['email', 'password', 'role', 'employeeNo'];
    if (activeStep === 1) fieldsToValidate = ['firstName', 'lastName', 'nicNo'];
    if (activeStep === 2) fieldsToValidate = ['dateJoined', 'employeeType', 'department'];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await api.post('/users', data);
      setSuccess(true);
      setActiveStep(0);
    } catch (err) {
      setApiError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (event, qual) => {
    const currentValues = watch('qualifications') || [];
    if (event.target.checked) {
      setValue('qualifications', [...currentValues, qual]);
    } else {
      setValue('qualifications', currentValues.filter((q) => q !== qual));
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Controller name="email" control={control} rules={{ required: 'Email required' }}
              render={({ field }) => <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} className="bg-white" />} />
            <Controller name="password" control={control} rules={{ required: 'Password required', minLength: 6 }}
              render={({ field }) => <TextField {...field} label="Password" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} className="bg-white" />} />
            <Controller name="employeeNo" control={control} rules={{ required: 'Emp No required' }}
              render={({ field }) => <TextField {...field} label="Employee No" fullWidth error={!!errors.employeeNo} helperText={errors.employeeNo?.message} className="bg-white" />} />
            <Controller name="role" control={control}
              render={({ field }) => (
                <TextField {...field} select label="System Role" fullWidth className="bg-white">
                  {['ADMIN', 'DEPT_HEAD', 'EMPLOYEE'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              )} />
            <Controller name="epfNo" control={control} render={({ field }) => <TextField {...field} label="EPF No" fullWidth className="bg-white" />} />
            <Controller name="fingerPrintId" control={control} render={({ field }) => <TextField {...field} label="Fingerprint ID" fullWidth className="bg-white" />} />
          </Box>
        );
      case 1:
        return (
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Controller name="firstName" control={control} rules={{ required: 'First name req' }}
              render={({ field }) => <TextField {...field} label="First Name" fullWidth error={!!errors.firstName} helperText={errors.firstName?.message} className="bg-white" />} />
            <Controller name="lastName" control={control} rules={{ required: 'Last name req' }}
              render={({ field }) => <TextField {...field} label="Last Name" fullWidth error={!!errors.lastName} helperText={errors.lastName?.message} className="bg-white" />} />
            <Controller name="nicNo" control={control} rules={{ required: 'NIC req' }}
              render={({ field }) => <TextField {...field} label="NIC No" fullWidth error={!!errors.nicNo} helperText={errors.nicNo?.message} className="bg-white" />} />
            <Controller name="gender" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Gender" fullWidth className="bg-white">
                  {['Male', 'Female', 'Other'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              )} />
            <Controller name="dob" control={control} render={({ field }) => <TextField {...field} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} fullWidth className="bg-white" />} />
            <Controller name="mobileNo" control={control} render={({ field }) => <TextField {...field} label="Mobile No" fullWidth className="bg-white" />} />
            <Controller name="address" control={control} render={({ field }) => <TextField {...field} label="Address" fullWidth className="md:col-span-2 bg-white" />} />
          </Box>
        );
      case 2:
        return (
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Controller name="dateJoined" control={control} rules={{ required: 'Date Joined is req' }}
              render={({ field }) => <TextField {...field} label="Date Joined" type="date" InputLabelProps={{ shrink: true }} fullWidth error={!!errors.dateJoined} helperText={errors.dateJoined?.message} className="bg-white" />} />
            <Controller name="employeeType" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Employee Type" fullWidth className="bg-white">
                  {['ASSIGNMENT_BASIS', 'PROBATION', 'CONTRACT', 'TEMPORARY', 'PERMANENT'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              )} />
            <Controller name="department" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Department" fullWidth className="bg-white">
                  {['ACADEMIC', 'FINANCE', 'MERC', 'COMPUTER', 'GENERAL_ADMIN', 'EXAMINATION', 'LIBRARY'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              )} />
            <Controller name="jobCategory" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Job Category" fullWidth className="bg-white">
                  {['ADMIN_FINANCE', 'ACADEMIC_SUPPORT', 'PRIMARY_LEVEL', 'ACADEMIC', 'CLERICAL_ALLIED', 'TECHNICAL'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              )} />
             <Controller name="grade" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Grade" fullWidth className="bg-white">
                  {['GRADE_1', 'GRADE_2', 'GRADE_3', 'NA'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              )} />
          </Box>
        );
      case 3:
        const currentQuals = watch('qualifications') || [];
        return (
          <Box className="mt-6 p-4 border border-slate-200 rounded bg-white">
            <Typography variant="subtitle1" className="mb-2 font-semibold">Select all that apply</Typography>
            <FormGroup className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {qualificationsList.map((qual) => (
                <FormControlLabel
                  key={qual}
                  control={
                    <Checkbox
                      checked={currentQuals.includes(qual)}
                      onChange={(e) => handleCheckboxChange(e, qual)}
                    />
                  }
                  label={qual.replace('_', ' ')}
                />
              ))}
            </FormGroup>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box className="max-w-4xl mx-auto py-8 px-4">
      <Paper elevation={0} className="p-8 border border-slate-200 rounded-xl shadow-sm bg-slate-50/50">
        <Typography variant="h4" className="text-slate-800 font-bold mb-8 text-center">
          Create New User
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel className="mb-8">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent(activeStep)}

          {apiError && <Alert severity="error" className="mt-4">{apiError}</Alert>}

          <Box className="flex justify-between mt-10">
            <Button disabled={activeStep === 0 || isSubmitting} onClick={handleBack} variant="outlined" color="primary">
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create User'}
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)} message="User successfully created!" />
    </Box>
  );
};

export default AddUserPage;
