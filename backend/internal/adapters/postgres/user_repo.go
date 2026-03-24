package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xlurr/ff-manager/internal/domain"
)

type UserRepo struct{ db *pgxpool.Pool }

func NewUserRepo(db *pgxpool.Pool) *UserRepo { return &UserRepo{db: db} }

const userSelect = `SELECT id::text,email,password_hash,role,full_name,is_active,
	COALESCE(last_login_at,'0001-01-01'::timestamptz) FROM users`

func (r *UserRepo) GetUser(ctx context.Context, id string) (*domain.User, error) {
	u, err := scanUser(r.db.QueryRow(ctx, userSelect+` WHERE id=$1::uuid`, id))
	if err != nil {
		return nil, fmt.Errorf("UserRepo.GetUser: %w", err)
	}
	return u, nil
}

func (r *UserRepo) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	u, err := scanUser(r.db.QueryRow(ctx, userSelect+` WHERE email=$1`, email))
	if err != nil {
		return nil, fmt.Errorf("UserRepo.GetUserByEmail: %w", err)
	}
	return u, nil
}

func (r *UserRepo) GetUsers(ctx context.Context) ([]domain.User, error) {
	rows, err := r.db.Query(ctx, userSelect+` ORDER BY full_name`)
	if err != nil {
		return nil, fmt.Errorf("UserRepo.GetUsers: %w", err)
	}
	defer rows.Close()
	var users []domain.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, fmt.Errorf("UserRepo.GetUsers scan: %w", err)
		}
		users = append(users, *u)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("UserRepo.GetUsers rows: %w", err)
	}
	if users == nil {
		users = []domain.User{}
	}
	return users, nil
}

func (r *UserRepo) CreateUser(ctx context.Context, user *domain.User) error {
	if user.ID == "" {
		user.ID = uuid.New().String()
	}
	const q = `INSERT INTO users (id,email,password_hash,role,full_name,is_active) VALUES ($1,$2,$3,$4,$5,$6)`
	if _, err := r.db.Exec(ctx, q, user.ID, user.Email, user.PasswordHash,
		string(user.Role), user.FullName, user.IsActive); err != nil {
		return fmt.Errorf("UserRepo.CreateUser: %w", err)
	}
	return nil
}

func (r *UserRepo) UpdateUser(ctx context.Context, user *domain.User) error {
	const q = `UPDATE users SET email=$2,role=$3,full_name=$4,is_active=$5 WHERE id=$1::uuid`
	if _, err := r.db.Exec(ctx, q, user.ID, user.Email, string(user.Role),
		user.FullName, user.IsActive); err != nil {
		return fmt.Errorf("UserRepo.UpdateUser: %w", err)
	}
	return nil
}

func (r *UserRepo) UpdateLastLoginAt(ctx context.Context, id string) error {
	if _, err := r.db.Exec(ctx, `UPDATE users SET last_login_at=NOW() WHERE id=$1::uuid`, id); err != nil {
		return fmt.Errorf("UserRepo.UpdateLastLoginAt: %w", err)
	}
	return nil
}

type pgxScanner interface{ Scan(dest ...any) error }

func scanUser(s pgxScanner) (*domain.User, error) {
	var u domain.User
	var role string
	var lastLogin time.Time
	if err := s.Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &u.FullName, &u.IsActive, &lastLogin); err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("scanUser: %w", err)
	}
	u.Role = domain.Role(role)
	u.LastLoginAt = lastLogin
	return &u, nil
}
