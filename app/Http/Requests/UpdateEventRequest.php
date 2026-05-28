<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class UpdateEventRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'event_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'event_start_date' => 'sometimes|required|date',
            'event_end_date' => 'sometimes|required|date|after_or_equal:event_start_date',
            'location' => 'nullable|string|max:255',
            'staff_ids'          => 'nullable|array',
            'staff_ids.*'         => 'integer|exists:staff,id',
            'shifts'              => 'nullable|array',
            'shifts.*.starts_at'  => 'required_with:shifts|date',
            'shifts.*.ends_at'    => 'required_with:shifts|date|after:shifts.*.starts_at',
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
