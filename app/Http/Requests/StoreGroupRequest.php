<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class StoreGroupRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'event_id' => 'required|exists:events,id',
            'staff_id' => 'required|exists:staff,id',
            'number_of_people' => 'required|integer',
            'group_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'activity_duration' => 'nullable|integer|min:1',
            'is_friend' => 'boolean',
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
