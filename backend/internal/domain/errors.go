package domain

import "errors"

// Sentinel errors для всех слоёв приложения.
var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
	ErrInvalidAPIKey = errors.New("invalid api key")
	ErrForbidden     = errors.New("forbidden")
)
