<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class UpdateStaffRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'full_name' => 'sometimes|required|string|max:255',
            'is_available' => 'sometimes|required|boolean',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        $response = response()->json([
            'error' => 'Errore di validazione',
            'messages' => $validator->errors()->all()
        ], 422);
        throw new \Illuminate\Validation\ValidationException($validator, $response);
    }
}
