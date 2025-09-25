<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class UpdateGroupRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'staff_id' => 'sometimes|nullable|exists:staff,id',
            'number_of_people' => 'sometimes|required|integer',
            'is_closed' => 'sometimes|nullable|boolean',
            'group_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_waiting' => 'nullable|boolean',
            'date' => 'sometimes|required|date',
            'activity_duration' => 'nullable|integer|min:1',
            'is_friend' => 'boolean',
            'is_kid' => 'nullable|boolean',
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
