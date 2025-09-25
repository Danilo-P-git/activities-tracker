<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
/**
 * @OA\Schema(
 *   schema="Staff",
 *   required={"full_name", "is_available"},
 *   @OA\Property(property="id", type="integer", readOnly=true),
 *   @OA\Property(property="full_name", type="string"),
 *   @OA\Property(property="is_available", type="string"),
 *   @OA\Property(property="created_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="updated_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="deleted_at", type="string", format="date-time", nullable=true, readOnly=true)
 * )
 */

class Staff extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'full_name',
        'is_available',
    ];
    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_staff')
            ->using(\App\Models\EventStaff::class)
            ->withPivot(['added_at', 'removed_at', 'deleted_at'])
            ->withTimestamps()
            ->wherePivotNull('deleted_at');
    }
}
